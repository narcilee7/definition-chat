import { EmbeddedDocument, simpleEmbed, cosineSimilarity } from './embedding';

/**
 * VectorMemoryStore — 内存向量存储
 * 支持语义相似度检索
 * 生产环境应替换为 Pinecone/Milvus/pgvector 等
 */
export class VectorMemoryStore {
  private documents: EmbeddedDocument[] = [];
  private dimension: number;

  constructor(dimension = 128) {
    this.dimension = dimension;
  }

  async add(id: string, content: string, metadata?: Record<string, unknown>): Promise<void> {
    const existing = this.documents.findIndex((d) => d.id === id);
    const doc: EmbeddedDocument = {
      id,
      content,
      vector: simpleEmbed(content, this.dimension),
      metadata,
    };

    if (existing >= 0) {
      this.documents[existing] = doc;
    } else {
      this.documents.push(doc);
    }
  }

  async search(query: string, topK = 5): Promise<Array<{ document: EmbeddedDocument; score: number }>> {
    const queryVector = simpleEmbed(query, this.dimension);

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
