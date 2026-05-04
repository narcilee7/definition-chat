import { BaseProvider } from './base';
import { getConfig } from '../config';

/**
 * OpenRouter — 聚合多模型平台
 */
export class OpenRouterProvider extends BaseProvider {
  readonly name = 'openrouter';

  constructor() {
    const cfg = getConfig().providers.openrouter;
    super({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      model: cfg.model,
      name: 'openrouter',
    });
  }
}
