import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import {
  LLMProviderFactory,
  ProviderName,
  ChatMessage,
  ChatOptions,
  StreamChunk,
} from '@ohme/agent-framework';

const PROVIDER_ENV_MAP: Record<string, string> = {
  [ProviderName.SiliconFlow]: 'SILICONFLOW_API_KEY',
  [ProviderName.DeepSeek]: 'DEEPSEEK_API_KEY',
  [ProviderName.Groq]: 'GROQ_API_KEY',
  [ProviderName.OpenRouter]: 'OPENROUTER_API_KEY',
  [ProviderName.OpenAICompatible]: 'OPENAI_COMPAT_API_KEY',
};

/**
 * LLM Fallback Service
 *
 * 自动按优先级尝试多个 LLM Provider：
 * 1. 默认 provider（DEFAULT_LLM_PROVIDER）
 * 2. 其他已配置 API Key 的 provider
 *
 * 当主 provider 失败（如 401、timeout）时自动降级到下一个，
 * 避免单点故障导致服务不可用。
 */
@Injectable()
export class LLMFallbackService {
  private readonly logger = createLogger('LLMFallbackService');

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<{ content: string; toolCalls?: Array<{ id: string; name: string; arguments: string }> }> {
    const providers = this.getAvailableProviders();
    if (providers.length === 0) {
      throw new Error('No LLM provider configured. Please set at least one API key.');
    }

    let lastError: Error | undefined;

    for (const provider of providers) {
      try {
        this.logger.debug(`Trying provider: ${provider.name}`);
        const result = await provider.chat(messages, options);
        this.logger.info(`Provider succeeded`, { provider: provider.name });
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`Provider failed`, {
          provider: provider.name,
          error: lastError.message,
        });
      }
    }

    this.logger.error('All providers failed', { error: lastError?.message });
    throw lastError || new Error('All LLM providers failed');
  }

  async *stream(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncGenerator<StreamChunk> {
    const providers = this.getAvailableProviders();
    if (providers.length === 0) {
      throw new Error('No LLM provider configured. Please set at least one API key.');
    }

    let lastError: Error | undefined;

    for (const provider of providers) {
      try {
        this.logger.debug(`Trying provider stream: ${provider.name}`);
        for await (const chunk of provider.stream!(messages, options)) {
          yield chunk;
        }
        this.logger.info(`Provider stream succeeded`, { provider: provider.name });
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`Provider stream failed`, {
          provider: provider.name,
          error: lastError.message,
        });
      }
    }

    this.logger.error('All provider streams failed', { error: lastError?.message });
    throw lastError || new Error('All LLM providers failed');
  }

  /** 获取按优先级排序的可用 provider 列表 */
  private getAvailableProviders() {
    const defaultName = process.env.DEFAULT_LLM_PROVIDER || '';
    const allNames = Object.values(ProviderName);

    const providers = allNames
      .filter((name) => this.isProviderConfigured(name))
      .map((name) => {
        try {
          return LLMProviderFactory.create(name);
        } catch {
          return null;
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // 默认 provider 排到最前面
    const defaultIndex = providers.findIndex((p) => p.name === defaultName);
    if (defaultIndex > 0) {
      const [defaultProvider] = providers.splice(defaultIndex, 1);
      providers.unshift(defaultProvider);
    }

    return providers;
  }

  /** 检查 provider 是否已配置 API Key */
  private isProviderConfigured(name: string): boolean {
    const envKey = PROVIDER_ENV_MAP[name];
    return !!envKey && !!process.env[envKey];
  }
}
