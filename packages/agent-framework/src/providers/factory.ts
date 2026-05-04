import { LLMProvider, ProviderName } from '../types';
import { getConfig } from '../config';
import { SiliconFlowProvider } from './siliconflow';
import { DeepSeekProvider } from './deepseek';
import { GroqProvider } from './groq';
import { OpenRouterProvider } from './openrouter';
import { OpenAICompatibleProvider } from './openai-compatible';

export class LLMProviderFactory {
  static create(providerName?: string): LLMProvider {
    const config = getConfig();
    const name = (providerName || config.defaultProvider) as ProviderName;

    switch (name) {
      case ProviderName.SiliconFlow:
        return new SiliconFlowProvider();
      case ProviderName.DeepSeek:
        return new DeepSeekProvider();
      case ProviderName.Groq:
        return new GroqProvider();
      case ProviderName.OpenRouter:
        return new OpenRouterProvider();
      case ProviderName.OpenAICompatible:
        return new OpenAICompatibleProvider();
      default:
        return new OpenAICompatibleProvider({ name });
    }
  }

  static list(): ProviderName[] {
    return Object.values(ProviderName);
  }
}
