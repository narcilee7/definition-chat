import { BaseProvider } from './base';
import { getConfig } from '../config';

/**
 * DeepSeek — 深度求索，国内头部大模型
 * 推理能力极强，价格便宜，API 兼容 OpenAI 格式
 */
export class DeepSeekProvider extends BaseProvider {
  readonly name = 'deepseek';

  constructor() {
    const cfg = getConfig().providers.deepseek;
    super({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      model: cfg.model,
      name: 'deepseek',
    });
  }
}
