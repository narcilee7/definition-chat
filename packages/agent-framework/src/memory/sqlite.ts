import { Memory, MemoryMessage, MemoryConfig } from '../types';

/**
 * SQLiteMemory — 基于内存 Map 的持久化模拟
 * 按 sessionId 隔离，支持跨会话记忆
 */
export class SQLiteMemory implements Memory {
  private sessionId: string;
  private maxMessages: number;
  private static store = new Map<string, MemoryMessage[]>();

  constructor(config: MemoryConfig) {
    this.sessionId = config.sessionId || 'default';
    this.maxMessages = config.maxMessages || 100;
  }

  async add(message: MemoryMessage): Promise<void> {
    const existing = SQLiteMemory.store.get(this.sessionId) || [];
    existing.push(message);
    if (existing.length > this.maxMessages) {
      SQLiteMemory.store.set(this.sessionId, existing.slice(-this.maxMessages));
    } else {
      SQLiteMemory.store.set(this.sessionId, existing);
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
