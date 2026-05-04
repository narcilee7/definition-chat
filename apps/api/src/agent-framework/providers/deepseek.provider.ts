import { BaseProvider } from './base.provider';

/**
 * DeepSeek — 深度求索，国内头部大模型
 * 推理能力极强，价格便宜，API 兼容 OpenAI 格式
 * 官网: https://platform.deepseek.com
 */
export class DeepSeekProvider extends BaseProvider {
  readonly name = 'deepseek';

  constructor(apiKey?: string, model?: string) {
    super({
      apiKey: apiKey || process.env.DEEPSEEK_API_KEY || '',
      baseUrl: 'https://api.deepseek.com/v1',
      model: model || process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      name: 'deepseek',
    });
  }
}
