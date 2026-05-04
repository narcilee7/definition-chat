import { LLMProvider, ChatMessage, ChatOptions, ProviderConfig, StreamChunk } from '../types';
import { parseSSEStream } from '../streaming';
import { Tool } from '../tools/types';

interface OpenAIFormatResponse {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
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

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
    tools?: Tool[],
  ): Promise<{ content: string; toolCalls?: Array<{ id: string; name: string; arguments: string }> }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);

    try {
      const body: Record<string, unknown> = {
        model: this.config.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 512,
        top_p: options?.topP ?? 0.9,
        stream: false,
      };

      if (tools && tools.length > 0) {
        body.tools = tools.map((t) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }));
        body.tool_choice = 'auto';
      }

      const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as OpenAIFormatResponse;
        throw new Error(err.error?.message || `${this.name} API error: ${res.status}`);
      }

      const data = (await res.json()) as OpenAIFormatResponse;
      const message = data.choices?.[0]?.message;
      const content = message?.content?.trim() || '';
      const toolCalls = message?.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
      }));

      return { content, toolCalls };
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`${this.name} request timeout`);
      }
      throw err;
    }
  }

  async *stream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<StreamChunk> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15000);

    try {
      const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 512,
          top_p: options?.topP ?? 0.9,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as OpenAIFormatResponse;
        throw new Error(err.error?.message || `${this.name} stream error: ${res.status}`);
      }

      for await (const chunk of parseSSEStream(res)) {
        yield chunk;
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`${this.name} stream timeout`);
      }
      throw err;
    }
  }
}
