// ============================================================
// OhMe Agent Framework — Embedding Provider
// ============================================================

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimension: number;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

interface OpenAIEmbedResponse {
  data?: Array<{
    embedding: number[];
    index: number;
  }>;
  error?: {
    message?: string;
  };
}

abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  abstract readonly name: string;
  abstract readonly dimension: number;
  protected apiKey: string;
  protected baseUrl: string;
  protected model: string;

  constructor(config: {
    apiKey: string;
    baseUrl: string;
    model: string;
  }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
  }

  async embed(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
        encoding_format: 'float',
      }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as OpenAIEmbedResponse;
      throw new Error(err.error?.message || `Embedding API error: ${res.status}`);
    }

    const data = (await res.json()) as OpenAIEmbedResponse;
    const embeddings = data.data?.sort((a, b) => a.index - b.index).map((d) => d.embedding);

    if (!embeddings || embeddings.length !== texts.length) {
      throw new Error('Embedding API returned incomplete results');
    }

    return embeddings;
  }
}

/**
 * SiliconFlow Embedding
 * 默认模型: BAAI/bge-large-zh-v1.5 (1024维) 或 BAAI/bge-m3 (1024维)
 */
export class SiliconFlowEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name = 'siliconflow-embedding';
  readonly dimension = 1024;

  constructor() {
    super({
      apiKey: process.env.SILICONFLOW_API_KEY || '',
      baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
      model: process.env.SILICONFLOW_EMBEDDING_MODEL || 'BAAI/bge-m3',
    });
  }
}

/**
 * OpenAI Compatible Embedding
 * 默认模型: text-embedding-3-small (1536维)
 */
export class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name = 'openai-embedding';
  readonly dimension = 1536;

  constructor() {
    super({
      apiKey: process.env.OPENAI_COMPAT_API_KEY || process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_COMPAT_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    });
  }
}

/**
 * 本地 Fallback Embedding (无需API Key)
 * 基于字符哈希的简单实现，仅用于开发和测试
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'local-embedding';
  readonly dimension: number;

  constructor(dimension = 384) {
    this.dimension = dimension;
  }

  async embed(text: string): Promise<number[]> {
    return this.hashEmbed(text, this.dimension);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.hashEmbed(t, this.dimension));
  }

  private hashEmbed(text: string, dim: number): number[] {
    const vec = new Array(dim).fill(0);
    const normalized = text.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');

    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i);
      const idx = code % dim;
      vec[idx] += 1;
    }

    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    if (mag === 0) return vec;
    return vec.map((v) => v / mag);
  }
}

export class EmbeddingProviderFactory {
  static create(name?: string): EmbeddingProvider {
    switch (name) {
      case 'siliconflow':
        return new SiliconFlowEmbeddingProvider();
      case 'openai':
        return new OpenAIEmbeddingProvider();
      case 'local':
      default:
        return new LocalEmbeddingProvider();
    }
  }
}
