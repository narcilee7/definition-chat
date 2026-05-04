import { BaseProvider } from './base.provider';

/**
 * 通用 OpenAI 兼容 Provider
 * 可配置任意兼容 OpenAI API 格式的云服务商
 * 通过环境变量配置 baseUrl, apiKey, model
 */
export class OpenAICompatibleProvider extends BaseProvider {
  readonly name: string;

  constructor(config?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    name?: string;
  }) {
    const name = config?.name || process.env.OPENAI_COMPAT_NAME || 'generic';
    super({
      apiKey: config?.apiKey || process.env.OPENAI_COMPAT_API_KEY || '',
      baseUrl:
        config?.baseUrl || process.env.OPENAI_COMPAT_BASE_URL || 'https://api.openai.com/v1',
      model: config?.model || process.env.OPENAI_COMPAT_MODEL || 'gpt-3.5-turbo',
      name,
    });
    this.name = name;
  }
}
