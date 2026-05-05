import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { LLMProviderFactory } from '@ohme/agent-framework';
import { RISK_DETECTION_SYSTEM_PROMPT, RiskDetectionResult } from '@ohme/prompts';

@Injectable()
export class RiskDetectorService {
  private readonly logger = createLogger('RiskDetectorService');
  private provider = LLMProviderFactory.create('deepseek');

  async detectRisk(text: string): Promise<RiskDetectionResult> {
    try {
      const { chat } = this.provider;
      const res = await chat(
        [
          { role: 'system', content: RISK_DETECTION_SYSTEM_PROMPT },
          { role: 'user', content: `分析以下对话内容，输出严格JSON：\n\n${text}` },
        ],
        { temperature: 0.1, maxTokens: 512 },
      );

      const cleaned = res.content.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      const result = JSON.parse(cleaned) as RiskDetectionResult;

      this.logger.info('Risk detection completed', {
        riskLevel: result.riskLevel,
        riskType: result.riskType,
        confidence: result.confidence,
      });

      return result;
    } catch (err) {
      this.logger.error('Risk detection failed', { error: err, text: text.slice(0, 200) });
      return {
        riskDetected: false,
        riskType: null,
        riskLevel: 'none',
        confidence: 0,
        keyPhrases: [],
        recommendedAction: 'continue',
      };
    }
  }

  quickScan(text: string): { flagged: boolean; reason: string } {
    const lower = text.toLowerCase();
    const highRiskPatterns = [
      { pattern: /想死|不想活|活着没意义|想解脱|自杀/, reason: 'suicidal_ideation' },
      { pattern: /自残|割腕|伤害自己|想割|烧伤自己/, reason: 'self_harm' },
      { pattern: /幻觉|幻听|妄想|被监控|有人在脑子里/, reason: 'psychosis' },
    ];

    for (const { pattern, reason } of highRiskPatterns) {
      if (pattern.test(lower)) {
        return { flagged: true, reason };
      }
    }
    return { flagged: false, reason: '' };
  }
}
