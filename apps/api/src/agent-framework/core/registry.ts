import { AgentPersona } from './types';
import { Agent } from './agent';

/**
 * AgentRegistry — Agent 注册表
 * 管理所有可用 Agent 的创建和检索
 */
export class AgentRegistry {
  private personas: Map<string, AgentPersona> = new Map();
  private instances: Map<string, Agent> = new Map();

  register(persona: AgentPersona): void {
    this.personas.set(persona.id, persona);
  }

  registerMany(personas: AgentPersona[]): void {
    for (const p of personas) {
      this.personas.set(p.id, p);
    }
  }

  getPersona(id: string): AgentPersona | undefined {
    return this.personas.get(id);
  }

  getAgent(id: string): Agent {
    // Return cached instance if exists
    const cached = this.instances.get(id);
    if (cached) return cached;

    // Create new instance
    const persona = this.personas.get(id);
    if (!persona) {
      throw new Error(`Agent persona not found: ${id}`);
    }

    const agent = new Agent(persona);
    this.instances.set(id, agent);
    return agent;
  }

  getOrCreateAgent(persona: AgentPersona): Agent {
    const cached = this.instances.get(persona.id);
    if (cached) return cached;

    this.personas.set(persona.id, persona);
    const agent = new Agent(persona);
    this.instances.set(persona.id, agent);
    return agent;
  }

  listPersonas(): AgentPersona[] {
    return Array.from(this.personas.values());
  }

  remove(id: string): void {
    this.personas.delete(id);
    this.instances.delete(id);
  }

  clearInstances(): void {
    this.instances.clear();
  }
}

// Singleton instance
export const globalRegistry = new AgentRegistry();
