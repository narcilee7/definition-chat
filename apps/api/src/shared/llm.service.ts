import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface OpenRouterError {
  error?: {
    message?: string;
  };
}

@Injectable()
export class LlmService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly model = 'anthropic/claude-3.5-haiku';

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENROUTER_API_KEY') || '';
  }

  async chat(messages: LLMMessage[], maxTokens = 512): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.config.get('WEB_URL') || 'http://localhost:3000',
          'X-Title': 'OhMe',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as OpenRouterError;
        throw new Error(err.error?.message || `LLM API error: ${res.status}`);
      }

      const data = (await res.json()) as OpenRouterResponse;
      return { content: data.choices?.[0]?.message?.content?.trim() || '' };
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('LLM request timeout');
      }
      throw err;
    }
  }
}
