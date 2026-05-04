import { BaseProvider } from './base';
import { getConfig } from '../config';

/**
 * SiliconFlow (硅基流动) — 国内多模型推理平台
 * 支持 Qwen、Llama、DeepSeek、ChatGLM 等大量开源模型
 * API 兼容 OpenAI 格式，国内直连，价格极低
 */
export class SiliconFlowProvider extends BaseProvider {
  readonly name = 'siliconflow';

  constructor() {
    const cfg = getConfig().providers.siliconflow;
    super({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      model: cfg.model,
      name: 'siliconflow',
    });
  }
}
