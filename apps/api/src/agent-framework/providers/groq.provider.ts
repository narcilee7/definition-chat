import { BaseProvider } from './base.provider';

/**
 * Groq — 超快推理平台
 * 支持 Llama、Mixtral 等，推理速度极快
 * 官网: https://groq.com
 */
export class GroqProvider extends BaseProvider {
  readonly name = 'groq';

  constructor(apiKey?: string, model?: string) {
    super({
      apiKey: apiKey || process.env.GROQ_API_KEY || '',
      baseUrl: 'https://api.groq.com/openai/v1',
      model: model || process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      name: 'groq',
    });
  }
}
