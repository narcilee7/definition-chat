import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';
import { SessionManagerService } from '../therapy/session-manager.service';
import { PromptBuilderService } from '../therapy/prompt-builder.service';
import { RiskDetectorService } from '../risk/risk-detector.service';
import { CrisisInterventionService } from '../risk/crisis-intervention.service';
import { LLMFallbackService } from '../llm/llm-fallback.service';
import { CaseFormulationService } from '../case-formulation/case-formulation.service';
import { TherapyChatDto } from './dto/therapy-chat.dto';
import { ChatMessage, StreamChunk } from '@ohme/agent-framework';

interface SessionArtifacts {
  summary?: string;
  insights?: string[];
  homework?: Array<{ task: string; completed: boolean }>;
  moodTracking?: {
    primaryEmotions?: string[];
    moodScore?: number;
    anxietyScore?: number;
    stressScore?: number;
    sleepQuality?: 'poor' | 'fair' | 'good' | 'unknown';
    appetite?: 'low' | 'normal' | 'high' | 'unknown';
    note?: string;
  };
  caseFormulation?: {
    presentingProblems?: string;
    triggers?: string;
    thoughts?: string;
    emotions?: string;
    behaviors?: string;
    physical?: string;
    newCoreBeliefs?: string[];
    newIntermediateBeliefs?: string[];
    newCopingStrategies?: string[];
    newGoals?: Array<{ goal: string; timeframe: string }>;
  };
}

@Injectable()
export class ChatService {
  private readonly logger = createLogger('ChatService');

  constructor(
    private prisma: PrismaService,
    private sessionManager: SessionManagerService,
    private promptBuilder: PromptBuilderService,
    private riskDetector: RiskDetectorService,
    private crisisService: CrisisInterventionService,
    private llm: LLMFallbackService,
    private caseFormulation: CaseFormulationService,
  ) {}

  async *streamChat(dto: TherapyChatDto): AsyncGenerator<StreamChunk & { riskLevel?: string; technique?: string }> {
    const startTime = Date.now();

    // 1. Load session state
    const sessionState = await this.sessionManager.getSessionState(dto.sessionId);
    if (!sessionState) {
      throw new Error('Session not found');
    }

    // 2. Save user message
    await this.prisma.sessionMessage.create({
      data: {
        sessionId: dto.sessionId,
        role: 'user',
        content: dto.content,
      },
    });

    // 3. Load session
    const session = await this.prisma.therapySession.findUnique({
      where: { id: dto.sessionId },
      include: { therapist: { include: { approach: true } } },
    });

    if (!session) throw new Error('Session not found in DB');

    // 4. Quick risk scan
    const quickScan = this.riskDetector.quickScan(dto.content);
    if (quickScan.flagged) {
      this.logger.warn('Quick risk scan flagged', { sessionId: dto.sessionId, reason: quickScan.reason });

      const riskResult = await this.riskDetector.detectRisk(dto.content);
      const riskLevel =
        riskResult.riskDetected && riskResult.riskLevel !== 'none' ? riskResult.riskLevel : 'high';

      sessionState.riskLevel = riskLevel;
      await this.sessionManager.setRiskLevel(dto.sessionId, riskLevel);
      await this.logCrisisIfNeeded({
        userId: session.userId,
        sessionId: dto.sessionId,
        riskLevel,
        triggerMessage: dto.content,
        triggerType: riskResult.riskType || quickScan.reason,
      });

      if (['moderate', 'high', 'imminent'].includes(riskLevel)) {
        const crisisResponse = this.crisisService.getInterventionResponse({
          ...riskResult,
          riskDetected: true,
          riskLevel: riskLevel as any,
          riskType: riskResult.riskType || quickScan.reason,
        });

        await this.prisma.sessionMessage.create({
          data: {
            sessionId: dto.sessionId,
            role: 'therapist',
            content: crisisResponse,
            interventionType: 'crisis_intervention',
            techniqueUsed: '危机干预',
            riskFlag: true,
            latencyMs: Date.now() - startTime,
          },
        });

        await this.sessionManager.persistSession(dto.sessionId);

        yield { content: crisisResponse, done: false, riskLevel };
        yield { content: '', done: true, riskLevel, technique: '危机干预' };
        return;
      }
    }

    // 5. Build system prompt
    const systemPrompt = await this.promptBuilder.buildSystemPrompt({
      userId: session.userId,
      sessionId: dto.sessionId,
      sessionNumber: session.sessionNumber,
      phase: sessionState.phase,
      presentingProblem: session.presentingProblem || undefined,
      agenda: sessionState.agenda.map((a) => ({
        topic: a.topic,
        priority: a.priority,
        status: a.status,
      })),
      homeworkReview: sessionState.homework,
      previousSessionSummary: undefined, // TODO: 从上次会话生成摘要
      insights: sessionState.insights,
      skillsIntroduced: sessionState.skillsIntroduced,
    });

    // 6. Build message history
    const recentMessages = await this.prisma.sessionMessage.findMany({
      where: { sessionId: dto.sessionId },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });

    const messages: ChatMessage[] = [
      { role: 'system' as const, content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: this.toLLMRole(m.role),
        content: m.content,
      })),
    ];

    // 7. Stream LLM response
    let fullContent = '';
    let interventionType = '';
    let technique = '';

    try {
      for await (const chunk of this.llm.stream(messages, { temperature: 0.7, maxTokens: 1024 })) {
        fullContent += chunk.content;
        yield { ...chunk, riskLevel: sessionState.riskLevel };
      }

      const intervention = this.inferIntervention(dto.content, fullContent);
      interventionType = intervention.interventionType;
      technique = intervention.technique;

      // 8. Risk detection on full response
      const riskResult = await this.riskDetector.detectRisk(dto.content + '\n' + fullContent);

      if (riskResult.riskDetected && ['moderate', 'high', 'imminent'].includes(riskResult.riskLevel)) {
        if (['high', 'imminent'].includes(riskResult.riskLevel)) {
          this.logger.warn('High risk detected', {
            sessionId: dto.sessionId,
            riskLevel: riskResult.riskLevel,
            riskType: riskResult.riskType,
          });
        }

        sessionState.riskLevel = riskResult.riskLevel;
        await this.sessionManager.setRiskLevel(dto.sessionId, riskResult.riskLevel);
        await this.logCrisisIfNeeded({
          userId: session.userId,
          sessionId: dto.sessionId,
          riskLevel: riskResult.riskLevel,
          triggerMessage: dto.content,
          triggerType: riskResult.riskType || undefined,
        });

        if (['high', 'imminent'].includes(riskResult.riskLevel)) {
          const crisisResponse = this.crisisService.getInterventionResponse(riskResult);
          if (crisisResponse) {
            yield { content: '\n\n---\n\n' + crisisResponse, done: false, riskLevel: riskResult.riskLevel };
            fullContent += '\n\n---\n\n' + crisisResponse;
          }
        }
      }

      // 9. Save AI response
      await this.prisma.sessionMessage.create({
        data: {
          sessionId: dto.sessionId,
          role: 'therapist',
          content: fullContent,
          interventionType: interventionType || null,
          techniqueUsed: technique || null,
          riskFlag: sessionState.riskLevel !== 'none',
          latencyMs: Date.now() - startTime,
        },
      });

      if (technique) this.sessionManager.addSkill(dto.sessionId, technique);
      const insight = this.extractInsight(fullContent);
      if (insight) this.sessionManager.addInsight(dto.sessionId, insight);

      // 10. Update session state
      const messageCount = await this.prisma.sessionMessage.count({
        where: { sessionId: dto.sessionId },
      });

      // V5 后台阶段推进：用户不可见，只用于调整回应重心。
      const phaseThresholds: Record<string, number> = {
        engagement: 4,
        assessment: 10,
        intervention: 28,
        closure: 999,
      };

      if (messageCount >= (phaseThresholds[sessionState.phase] || 999)) {
        this.sessionManager.advancePhase(dto.sessionId);
      }

      await this.sessionManager.persistSession(dto.sessionId);
      await this.updateTreatmentArtifacts(dto.sessionId, session.userId);

      // 11. Log completion
      this.logger.info('Therapy chat completed', {
        sessionId: dto.sessionId,
        phase: sessionState.phase,
        technique,
        riskLevel: sessionState.riskLevel,
        latencyMs: Date.now() - startTime,
      });

      yield { content: '', done: true, riskLevel: sessionState.riskLevel, technique };
    } catch (err) {
      this.logger.error('Therapy chat failed', { sessionId: dto.sessionId, error: err });
      throw err;
    }
  }

  async chat(dto: TherapyChatDto) {
    const chunks: string[] = [];
    let riskLevel = 'none';
    let technique = '';

    for await (const chunk of this.streamChat(dto)) {
      if (!chunk.done) {
        chunks.push(chunk.content);
      }
      riskLevel = chunk.riskLevel || riskLevel;
      technique = chunk.technique || technique;
    }

    return {
      content: chunks.join(''),
      riskLevel,
      technique,
    };
  }

  async getSessionWithMessages(id: string) {
    return this.prisma.therapySession.findUnique({
      where: { id },
      include: {
        therapist: { include: { approach: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async completeSession(sessionId: string) {
    const session = await this.prisma.therapySession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true },
    });
    if (!session) throw new Error('Session not found');

    const state = await this.sessionManager.getSessionState(sessionId);
    if (state) {
      this.sessionManager.setPhase(sessionId, 'closure');
      await this.sessionManager.persistSession(sessionId);
    } else {
      await this.prisma.therapySession.update({
        where: { id: sessionId },
        data: { phase: 'closure' },
      });
    }

    await this.updateTreatmentArtifacts(sessionId, session.userId, { force: true });

    return this.prisma.therapySession.findUnique({
      where: { id: sessionId },
      select: {
        phase: true,
        sessionSummary: true,
        insights: true,
        homework: true,
        skillsIntroduced: true,
        summaryGeneratedAt: true,
      },
    });
  }

  private toLLMRole(role: string): ChatMessage['role'] {
    if (role === 'therapist') return 'assistant';
    if (role === 'assistant') return 'assistant';
    if (role === 'system') return 'system';
    if (role === 'tool') return 'tool';
    return 'user';
  }

  private inferIntervention(userContent: string, therapistContent: string) {
    const text = `${userContent}\n${therapistContent}`;
    const rules = [
      {
        interventionType: 'cognitive_restructuring',
        technique: '认知重构',
        pattern: /想法|事实|证据|全或无|必须|应该|不行|失败|自动思维/,
      },
      {
        interventionType: 'somatic_awareness',
        technique: '身体觉察',
        pattern: /胸口|心跳|呼吸|身体|发紧|睡不着|失眠|放松/,
      },
      {
        interventionType: 'values_clarification',
        technique: '价值澄清',
        pattern: /意义|重视|在乎|价值|方向|想成为/,
      },
      {
        interventionType: 'emotion_regulation',
        technique: '情绪调节',
        pattern: /情绪|焦虑|愤怒|低落|难受|崩溃|压抑/,
      },
      {
        interventionType: 'behavioral_experiment',
        technique: '行为实验',
        pattern: /练习|尝试|小实验|行动|下次|今天可以/,
      },
    ];

    return (
      rules.find((rule) => rule.pattern.test(text)) || {
        interventionType: 'supportive_clarification',
        technique: '支持性澄清',
      }
    );
  }

  private extractInsight(content: string): string | null {
    const sentences = content
      .split(/[。！？\n]/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    return (
      sentences.find(
        (sentence) =>
          sentence.length >= 12 &&
          sentence.length <= 90 &&
          /听起来|我注意到|也许|可能|像是|不是.*而是|一方面|背后/.test(sentence),
      ) || null
    );
  }

  private async logCrisisIfNeeded(params: {
    userId: string;
    sessionId: string;
    riskLevel: string;
    triggerMessage: string;
    triggerType?: string;
  }) {
    if (!['moderate', 'high', 'imminent'].includes(params.riskLevel)) return;

    await this.prisma.crisisLog.create({
      data: {
        userId: params.userId,
        sessionId: params.sessionId,
        riskLevel: params.riskLevel,
        triggerMessage: params.triggerMessage,
        triggerType: params.triggerType,
        escalated: ['high', 'imminent'].includes(params.riskLevel),
      },
    });
  }

  private async updateTreatmentArtifacts(
    sessionId: string,
    userId: string,
    options: { force?: boolean } = {},
  ) {
    const messages = await this.prisma.sessionMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    const userMessageCount = messages.filter((m) => m.role === 'user').length;
    if (!options.force && userMessageCount < 2) return;
    if (options.force && userMessageCount < 1) return;

    const transcript = messages
      .map((m) => `${m.role === 'user' ? '来访者' : '咨询师'}：${m.content}`)
      .join('\n\n');

    const artifacts = await this.extractSessionArtifacts(transcript);
    if (!artifacts) return;

    const current = await this.prisma.therapySession.findUnique({
      where: { id: sessionId },
      select: { insights: true, homework: true, postMood: true, presentingProblem: true },
    });
    if (!current) return;

    const nextInsights = [...new Set([...(current.insights || []), ...(artifacts.insights || [])])].slice(-12);
    const nextHomework = [...((current.homework as any[]) || []), ...(artifacts.homework || [])].slice(-8);
    const postMood = this.mergePostMood(current.postMood, artifacts.moodTracking);

    await this.prisma.therapySession.update({
      where: { id: sessionId },
      data: {
        sessionSummary: artifacts.summary || undefined,
        summaryGeneratedAt: artifacts.summary ? new Date() : undefined,
        insights: nextInsights,
        homework: nextHomework as any,
        postMood,
      },
    });

    if (artifacts.caseFormulation) {
      await this.caseFormulation.updateFromSession(userId, {
        presentingProblems:
          artifacts.caseFormulation.presentingProblems || current.presentingProblem || undefined,
        ...artifacts.caseFormulation,
      });
    }
  }

  private mergePostMood(existing: unknown, moodTracking?: SessionArtifacts['moodTracking']) {
    const postMood =
      typeof existing === 'object' && existing !== null && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};

    if (!moodTracking) return postMood as any;

    const clampScore = (value: unknown) => {
      if (typeof value !== 'number') return undefined;
      return Math.max(0, Math.min(10, Math.round(value)));
    };

    return {
      ...postMood,
      extracted: {
        primaryEmotions: moodTracking.primaryEmotions || [],
        moodScore: clampScore(moodTracking.moodScore),
        anxietyScore: clampScore(moodTracking.anxietyScore),
        stressScore: clampScore(moodTracking.stressScore),
        sleepQuality: moodTracking.sleepQuality || 'unknown',
        appetite: moodTracking.appetite || 'unknown',
        note: moodTracking.note,
        extractedAt: new Date().toISOString(),
      },
    } as any;
  }

  private async extractSessionArtifacts(transcript: string): Promise<SessionArtifacts | null> {
    try {
      const res = await this.llm.chat(
        [
          {
            role: 'system',
            content: `你是一位资深心理咨询督导师。请从治疗对话中提取后台治疗资产，只输出纯 JSON，不要 markdown。

JSON 结构：
{
  "summary": "3-5句话的会话摘要",
  "insights": ["核心洞察，最多3条"],
  "homework": [{"task": "轻量可执行练习", "completed": false}],
  "moodTracking": {
    "primaryEmotions": ["焦虑", "低落"],
    "moodScore": 4,
    "anxietyScore": 7,
    "stressScore": 8,
    "sleepQuality": "poor",
    "appetite": "unknown",
    "note": "用户提到最近睡眠困难和工作压力升高"
  },
  "caseFormulation": {
    "presentingProblems": "主诉概括",
    "triggers": "诱发情境",
    "thoughts": "自动思维",
    "emotions": "核心情绪",
    "behaviors": "维持行为",
    "physical": "身体反应",
    "newCoreBeliefs": ["可能的核心信念"],
    "newIntermediateBeliefs": ["中间信念/规则"],
    "newCopingStrategies": ["应对策略"],
    "newGoals": [{"goal": "治疗目标", "timeframe": "short_term"}]
  }
}

要求：
- 不做诊断，不夸大风险。
- 信息不足的字段可以省略或留空。
- homework 最多 1 条，必须低压力、具体、可在 5 分钟内完成。
- moodScore/anxietyScore/stressScore 用 0-10 分。只在对话中有明确线索时填写，否则省略。
- insights 和 caseFormulation 是治疗师后台使用，不要写成对用户的评价标签。`,
          },
          { role: 'user', content: transcript },
        ],
        { temperature: 0.2, maxTokens: 900 },
      );

      return this.parseJson<SessionArtifacts>(res.content);
    } catch (err) {
      this.logger.warn('Treatment artifact extraction failed', { error: err });
      return null;
    }
  }

  private parseJson<T>(content: string): T | null {
    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*$/gi, '')
      .trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}
