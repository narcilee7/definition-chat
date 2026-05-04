import { Memory, MemoryMessage } from '../core/types';

/**
 * WindowMemory — 基于近似 token 数的滑动窗口
 * 保留最近 N 条消息，同时估算 token 总量做二次截断
 */
export class WindowMemory implements Memory {
  private messages: MemoryMessage[] = [];
  private maxMessages: number;
  private maxTokens: number;

  constructor(maxMessages = 20, maxTokens = 4000) {
    this.maxMessages = maxMessages;
    this.maxTokens = maxTokens;
  }

  async add(message: MemoryMessage): Promise<void> {
    this.messages.push(message);
    this.trim();
  }

  async get(limit?: number): Promise<MemoryMessage[]> {
    const msgs = limit ? this.messages.slice(-limit) : [...this.messages];
    return msgs;
  }

  async getContext(_query?: string, limit?: number): Promise<MemoryMessage[]> {
    return this.get(limit);
  }

  async clear(): Promise<void> {
    this.messages = [];
  }

  private trim(): void {
    // First trim by message count
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    // Then trim by approximate token count (1 token ≈ 4 chars for CJK, 1 char for EN)
    let totalTokens = 0;
    for (const m of this.messages) {
      totalTokens += this.estimateTokens(m.content);
    }

    while (totalTokens > this.maxTokens && this.messages.length > 1) {
      const removed = this.messages.shift()!;
      totalTokens -= this.estimateTokens(removed.content);
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimate: CJK chars ≈ 1.5 tokens each, ASCII ≈ 0.3 tokens each
    let tokens = 0;
    for (const char of text) {
      tokens = char.charCodeAt(0) > 127 ? tokens + 1.5 : tokens + 0.3;
    }
    return Math.ceil(tokens);
  }
}
