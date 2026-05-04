import { EmbeddingProvider } from './embedding-provider';
import { LocalEmbeddingProvider } from './embedding-provider';

export interface EmbeddedDocument {
  id: string;
  content: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

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
  return denom === 0 ? 0 : dot / denom;
}

export class VectorMemoryStore {
  private documents: EmbeddedDocument[] = [];
  private embedder: EmbeddingProvider;

  constructor(embedder?: EmbeddingProvider) {
    this.embedder = embedder || new LocalEmbeddingProvider();
  }

  async add(id: string, content: string, metadata?: Record<string, unknown>): Promise<void> {
    const existing = this.documents.findIndex((d) => d.id === id);
    const vector = await this.embedder.embed(content);
    const doc: EmbeddedDocument = { id, content, vector, metadata };

    if (existing >= 0) {
      this.documents[existing] = doc;
    } else {
      this.documents.push(doc);
    }
  }

  async search(query: string, topK = 5): Promise<Array<{ document: EmbeddedDocument; score: number }>> {
    const queryVector = await this.embedder.embed(query);

    const scored = this.documents.map((doc) => ({
      document: doc,
      score: cosineSimilarity(queryVector, doc.vector),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async delete(id: string): Promise<void> {
    this.documents = this.documents.filter((d) => d.id !== id);
  }

  async clear(): Promise<void> {
    this.documents = [];
  }

  count(): number {
    return this.documents.length;
  }

  getAll(): EmbeddedDocument[] {
    return [...this.documents];
  }
}
