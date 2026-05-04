import { Agent } from '../agent';
import { AgentResponse } from '../types';

/**
 * 并行执行多个 Agent
 * 同时向多个 Agent 发送请求，返回所有结果
 */
export async function parallelExecute(
  agents: Agent[],
  userMessage: string,
  history?: { role: 'user' | 'assistant'; content: string }[]
): Promise<AgentResponse[]> {
  const promises = agents.map(async (agent) => {
    try {
      return await agent.chatWithContext(history || [], userMessage);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Agent failed';
      return {
        content: `[${agent.persona.name}] ${msg}`,
        agentId: agent.persona.id,
        agentName: agent.persona.name,
        latencyMs: 0,
      };
    }
  });

  return Promise.all(promises);
}
