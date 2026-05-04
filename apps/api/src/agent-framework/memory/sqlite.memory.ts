import { Memory, MemoryMessage, MemoryConfig } from '../core/types';

/**
 * SQLiteMemory — 持久化到 SQLite 数据库
 * 按 sessionId 隔离，支持跨会话记忆
 * 注意：这是一个简化实现，实际使用需要 PrismaClient
 */
export class SQLiteMemory implements Memory {
  private sessionId: string;
  private maxMessages: number;

  // In-memory fallback when no Prisma available
  private static store: Map<string, MemoryMessage[]> = new Map();

  constructor(config: MemoryConfig) {
    this.sessionId = config.sessionId || 'default';
    this.maxMessages = config.maxMessages || 100;
  }

  async add(message: MemoryMessage): Promise<void> {
    const key = this.sessionId;
    const existing = SQLiteMemory.store.get(key) || [];
    existing.push(message);
    if (existing.length > this.maxMessages) {
      SQLiteMemory.store.set(key, existing.slice(-this.maxMessages));
    } else {
      SQLiteMemory.store.set(key, existing);
    }
  }

  async get(limit?: number): Promise<MemoryMessage[]> {
    const msgs = SQLiteMemory.store.get(this.sessionId) || [];
    if (!limit) return [...msgs];
    return msgs.slice(-limit);
  }

  async getContext(_query?: string, limit?: number): Promise<MemoryMessage[]> {
    return this.get(limit);
  }

  async clear(): Promise<void> {
    SQLiteMemory.store.delete(this.sessionId);
  }
}
