import { BaseProvider } from './base';
import { getConfig } from '../config';

/**
 * Groq — 超快推理平台
 * 支持 Llama、Mixtral 等，推理速度极快
 */
export class GroqProvider extends BaseProvider {
  readonly name = 'groq';

  constructor() {
    const cfg = getConfig().providers.groq;
    super({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      model: cfg.model,
      name: 'groq',
    });
  }
}
