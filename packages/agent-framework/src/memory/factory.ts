import { Memory, MemoryConfig, MemoryType } from '../types';
import { BufferMemory } from './buffer';
import { WindowMemory } from './window';
import { SQLiteMemory } from './sqlite';

export class MemoryFactory {
  static create(config: MemoryConfig): Memory {
    switch (config.type) {
      case MemoryType.Buffer:
        return new BufferMemory(config.maxMessages);
      case MemoryType.Window:
        return new WindowMemory(config.maxMessages, config.maxTokens);
      case MemoryType.SQLite:
        return new SQLiteMemory(config);
      default:
        return new BufferMemory(config.maxMessages);
    }
  }
}
