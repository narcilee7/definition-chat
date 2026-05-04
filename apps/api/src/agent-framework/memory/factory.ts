import { Memory, MemoryConfig } from '../core/types';
import { BufferMemory } from './buffer.memory';
import { WindowMemory } from './window.memory';
import { SQLiteMemory } from './sqlite.memory';

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
