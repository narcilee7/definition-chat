import { BaseProvider } from './base.provider';

/**
 * OpenRouter — 聚合多模型平台（保留作为 fallback）
 * 官网: https://openrouter.ai
 */
export class OpenRouterProvider extends BaseProvider {
  readonly name = 'openrouter';

  constructor(apiKey?: string, model?: string) {
    super({
      apiKey: apiKey || process.env.OPENROUTER_API_KEY || '',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: model || process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-haiku',
      name: 'openrouter',
    });
  }
}
