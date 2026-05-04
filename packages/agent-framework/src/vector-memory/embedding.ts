/**
 * 简易向量嵌入 — 使用词频 + 简单权重作为 fallback
 * 实际生产环境应接入 OpenAI/硅基流动的 embedding API
 */

export interface EmbeddedDocument {
  id: string;
  content: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

/**
 * 简易文本向量化（TF-like）
 * 生产环境应替换为真实的 embedding API
 */
export function simpleEmbed(text: string, dim = 128): number[] {
  const vector = new Array(dim).fill(0);
  const normalized = text.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const code = char.charCodeAt(0);
    const idx = code % dim;
    vector[idx] += 1;
  }

  // L2 normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vector;
  return vector.map((v) => v / magnitude);
}

/**
 * 余弦相似度
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimensions mismatch: ${a.length} vs ${b.length}`);
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return dot / denom;
}
