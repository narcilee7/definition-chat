import { Memory, MemoryMessage } from '../types';

/**
 * BufferMemory — 内存中的环形缓冲区
 * 保留最近 N 条消息，适合单次会话
 */
export class BufferMemory implements Memory {
  private messages: MemoryMessage[] = [];
  private maxMessages: number;

  constructor(maxMessages = 20) {
    this.maxMessages = maxMessages;
  }

  async add(message: MemoryMessage): Promise<void> {
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  async get(limit?: number): Promise<MemoryMessage[]> {
    if (!limit) return [...this.messages];
    return this.messages.slice(-limit);
  }

  async getContext(_query?: string, limit?: number): Promise<MemoryMessage[]> {
    return this.get(limit);
  }

  async clear(): Promise<void> {
    this.messages = [];
  }
}
