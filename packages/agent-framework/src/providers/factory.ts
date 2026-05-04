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
      case 'siliconflow':
        return new SiliconFlowProvider();
      case 'deepseek':
        return new DeepSeekProvider();
      case 'groq':
        return new GroqProvider();
      case 'openrouter':
        return new OpenRouterProvider();
      case 'openai-compatible':
        return new OpenAICompatibleProvider();
      default:
        return new OpenAICompatibleProvider({ name });
    }
  }

  static list(): ProviderName[] {
    return ['siliconflow', 'deepseek', 'groq', 'openrouter', 'openai-compatible'];
  }
}
