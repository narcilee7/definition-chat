import { LLMProvider, ChatMessage, ChatOptions, ProviderConfig } from '../types';

interface OpenAIFormatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export abstract class BaseProvider implements LLMProvider {
  abstract readonly name: string;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);

    try {
      const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 512,
          top_p: options?.topP ?? 0.9,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as OpenAIFormatResponse;
        throw new Error(
          err.error?.message || `${this.name} API error: ${res.status}`
        );
      }

      const data = (await res.json()) as OpenAIFormatResponse;
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error(`${this.name} returned empty content`);
      }
      return content;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`${this.name} request timeout`);
      }
      throw err;
    }
  }
}
