import { LLMProvider } from '../core/types';
import { SiliconFlowProvider } from './siliconflow.provider';
import { DeepSeekProvider } from './deepseek.provider';
import { GroqProvider } from './groq.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { OpenAICompatibleProvider } from './openai-compatible.provider';

export class LLMProviderFactory {
  static create(providerName?: string): LLMProvider {
    const name = providerName || process.env.DEFAULT_LLM_PROVIDER || 'siliconflow';

    switch (name.toLowerCase()) {
      case 'siliconflow':
        return new SiliconFlowProvider();
      case 'deepseek':
        return new DeepSeekProvider();
      case 'groq':
        return new GroqProvider();
      case 'openrouter':
        return new OpenRouterProvider();
      case 'generic':
      case 'openai-compatible':
        return new OpenAICompatibleProvider();
      default:
        // Try generic compatible
        return new OpenAICompatibleProvider({ name });
    }
  }

  static list(): string[] {
    return ['siliconflow', 'deepseek', 'groq', 'openrouter', 'openai-compatible'];
  }
}
