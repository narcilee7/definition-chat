import { Memory, MemoryConfig } from '../types';
import { BufferMemory } from './buffer';
import { WindowMemory } from './window';
import { SQLiteMemory } from './sqlite';

export class MemoryFactory {
  static create(config: MemoryConfig): Memory {
    switch (config.type) {
      case 'buffer':
        return new BufferMemory(config.maxMessages);
      case 'window':
        return new WindowMemory(config.maxMessages, config.maxTokens);
      case 'sqlite':
        return new SQLiteMemory(config);
      default:
        return new BufferMemory(config.maxMessages);
    }
  }
}
