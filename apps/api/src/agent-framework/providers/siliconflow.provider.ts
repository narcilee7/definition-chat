import { BaseProvider } from './base.provider';

/**
 * SiliconFlow (硅基流动) — 国内多模型推理平台
 * 支持 Qwen、Llama、DeepSeek、ChatGLM 等大量开源模型
 * API 兼容 OpenAI 格式，国内直连，价格极低
 * 官网: https://siliconflow.cn
 */
export class SiliconFlowProvider extends BaseProvider {
  readonly name = 'siliconflow';

  constructor(apiKey?: string, model?: string) {
    super({
      apiKey: apiKey || process.env.SILICONFLOW_API_KEY || '',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: model || process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
      name: 'siliconflow',
    });
  }
}
