import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';
import { SessionManagerService } from '../therapy/session-manager.service';
import { PromptBuilderService } from '../therapy/prompt-builder.service';
import { RiskDetectorService } from '../risk/risk-detector.service';
import { CrisisInterventionService } from '../risk/crisis-intervention.service';
import { LLMFallbackService } from '../llm/llm-fallback.service';
import { TherapyChatDto } from './dto/therapy-chat.dto';
import { StreamChunk } from '@ohme/agent-framework';

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

    // 3. Quick risk scan
    const quickScan = this.riskDetector.quickScan(dto.content);
    if (quickScan.flagged) {
      this.logger.warn('Quick risk scan flagged', { sessionId: dto.sessionId, reason: quickScan.reason });
    }

    // 4. Build system prompt
    const session = await this.prisma.therapySession.findUnique({
      where: { id: dto.sessionId },
      include: { therapist: { include: { approach: true } } },
    });

    if (!session) throw new Error('Session not found in DB');

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

    // 5. Build message history
    const recentMessages = await this.prisma.sessionMessage.findMany({
      where: { sessionId: dto.sessionId },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    // 6. Stream LLM response
    let fullContent = '';
    let technique = '';

    try {
      for await (const chunk of this.llm.stream(messages, { temperature: 0.7, maxTokens: 1024 })) {
        fullContent += chunk.content;
        yield { ...chunk, riskLevel: sessionState.riskLevel };
      }

      // Extract technique from content
      const techMatch = fullContent.match(/【(.+?)】/);
      if (techMatch) {
        technique = techMatch[1];
      }

      // 7. Risk detection on full response (if not already flagged)
      if (!quickScan.flagged) {
        const riskResult = await this.riskDetector.detectRisk(dto.content + '\n' + fullContent);

        if (riskResult.riskDetected && ['high', 'imminent'].includes(riskResult.riskLevel)) {
          this.logger.warn('High risk detected', {
            sessionId: dto.sessionId,
            riskLevel: riskResult.riskLevel,
            riskType: riskResult.riskType,
          });

          sessionState.riskLevel = riskResult.riskLevel;
          await this.sessionManager.setRiskLevel(dto.sessionId, riskResult.riskLevel);

          // Append crisis intervention if high risk
          const crisisResponse = this.crisisService.getInterventionResponse(riskResult);
          if (crisisResponse) {
            yield { content: '\n\n---\n\n' + crisisResponse, done: false, riskLevel: riskResult.riskLevel };
            fullContent += '\n\n---\n\n' + crisisResponse;
          }
        }
      }

      // 8. Save AI response
      await this.prisma.sessionMessage.create({
        data: {
          sessionId: dto.sessionId,
          role: 'therapist',
          content: fullContent,
          techniqueUsed: technique || null,
          riskFlag: sessionState.riskLevel !== 'none',
          latencyMs: Date.now() - startTime,
        },
      });

      // 9. Update session state
      const messageCount = await this.prisma.sessionMessage.count({
        where: { sessionId: dto.sessionId },
      });

      // Simple auto-advance heuristic
      const phaseThresholds: Record<string, number> = {
        agenda_setting: 4,
        mood_check: 8,
        theme_work: 25,
        summary: 999,
      };

      if (messageCount >= (phaseThresholds[sessionState.phase] || 999)) {
        this.sessionManager.advancePhase(dto.sessionId);
      }

      await this.sessionManager.persistSession(dto.sessionId);

      // 10. Log completion
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
}
