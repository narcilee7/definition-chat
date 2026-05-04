import { BaseProvider } from './base';
import { getConfig } from '../config';

/**
 * 通用 OpenAI 兼容 Provider
 * 可配置任意兼容 OpenAI API 格式的云服务商
 */
export class OpenAICompatibleProvider extends BaseProvider {
  readonly name: string;

  constructor(overrideConfig?: { name?: string }) {
    const cfg = getConfig().providers['openai-compatible'];
    super({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      model: cfg.model,
      name: overrideConfig?.name || 'generic',
    });
    this.name = overrideConfig?.name || 'generic';
  }
}
