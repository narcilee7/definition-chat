import { AgentPersona } from './types';
import { Agent } from './agent';

export class AgentRegistry {
  private personas = new Map<string, AgentPersona>();
  private instances = new Map<string, Agent>();

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
    const cached = this.instances.get(id);
    if (cached) return cached;

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

  count(): number {
    return this.personas.size;
  }
}

// Singleton
export const globalRegistry = new AgentRegistry();
