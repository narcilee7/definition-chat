import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';
import { LLMFallbackService } from '../llm/llm-fallback.service';
import { compileSystemPrompt } from '@ohme/prompts';

export interface RefractionRequest {
  userId: string;
  question: string;
  approachIds: string[];
}

export interface RefractionResult {
  approachId: string;
  approachName: string;
  content: string;
  techniques: string[];
  latencyMs: number;
}

@Injectable()
export class RefractionService {
  private readonly logger = createLogger('RefractionService');

  constructor(
    private prisma: PrismaService,
    private llm: LLMFallbackService,
  ) {}

  async refract(data: RefractionRequest): Promise<RefractionResult[]> {
    const { userId, question, approachIds } = data;

    const approaches = await this.prisma.therapyApproach.findMany({
      where: { name: { in: approachIds } },
    });

    const personas = await this.prisma.therapistPersona.findMany({
      where: {
        approachId: { in: approaches.map((a) => a.id) },
        isBuiltIn: true,
      },
      include: { approach: true },
    });

    const personaMap = new Map<string, typeof personas[0]>();
    for (const approach of approaches) {
      const persona = personas.find((p) => p.approachId === approach.id);
      if (persona) personaMap.set(approach.id, persona);
    }

    const results = await Promise.all(
      approaches.map(async (approach) => {
        const start = Date.now();
        const persona = personaMap.get(approach.id);

        if (!persona) {
          return {
            approachId: approach.name,
            approachName: approach.displayName,
            content: '该流派暂无可用咨询师。',
            techniques: [],
            latencyMs: 0,
          };
        }

        const systemPrompt = compileSystemPrompt({
          approachName: approach.name,
          persona: {
            name: persona.name,
            description: persona.description,
            styleTraits: (persona.styleTraits as any) || { directness: 0.5, warmth: 0.5, structure: 0.5, depth: 0.5 },
            voiceTone: persona.voiceTone,
            specialties: persona.specialties,
            boundaries: persona.boundaries,
            responseLength: 'concise',
          },
          phaseContext: {
            phase: 'theme_work' as any,
            sessionNumber: 1,
          },
        });

        const refractionPrompt = `${systemPrompt}\n\n---\n\n【特殊任务：流派折射】\n来访者提出了一个问题，需要你从${approach.displayName}的角度进行分析。\n\n要求：\n- 提供该流派的核心视角（1-2 句话）\n- 提出 2-3 个该流派会关注的问题\n- 建议 1-2 个该流派的干预技术\n- 总长度不超过 200 字\n- 在末尾标注使用的技术（格式：【技术名称】）`;

        try {
          const res = await this.llm.chat(
            [
              { role: 'system', content: refractionPrompt },
              { role: 'user', content: question },
            ],
            { temperature: 0.7, maxTokens: 512 },
          );

          const techniqueMatches = res.content.match(/【(.+?)】/g);
          const techniques = techniqueMatches
            ? techniqueMatches.map((m) => m.replace(/[【】]/g, ''))
            : [];

          return {
            approachId: approach.name,
            approachName: approach.displayName,
            content: res.content,
            techniques,
            latencyMs: Date.now() - start,
          };
        } catch (err) {
          this.logger.error('Refraction failed', { approach: approach.name, error: err });
          return {
            approachId: approach.name,
            approachName: approach.displayName,
            content: '分析过程中出现错误，请稍后重试。',
            techniques: [],
            latencyMs: Date.now() - start,
          };
        }
      }),
    );

    this.logger.info('Refraction completed', {
      userId,
      approachCount: approachIds.length,
    });

    return results;
  }
}
