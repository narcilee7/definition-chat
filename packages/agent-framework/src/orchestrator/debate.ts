import { Agent } from '../agent';
import { AgentResponse } from '../types';

/**
 * 两个 Agent 辩论
 * 双方就同一话题轮流发言
 */
export async function debateExecute(
  agentA: Agent,
  agentB: Agent,
  topic: string,
  rounds = 2
): Promise<AgentResponse[]> {
  const results: AgentResponse[] = [];
  let lastContent = topic;

  for (let i = 0; i < rounds; i++) {
    try {
      const resA = await agentA.chat(
        i === 0 ? topic : `对方说："${lastContent}"，请回应`
      );
      results.push(resA);
      lastContent = resA.content;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      results.push({
        content: `[${agentA.persona.name}] ${msg}`,
        agentId: agentA.persona.id,
        agentName: agentA.persona.name,
        latencyMs: 0,
      });
    }

    try {
      const resB = await agentB.chat(`对方说："${lastContent}"，请回应`);
      results.push(resB);
      lastContent = resB.content;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      results.push({
        content: `[${agentB.persona.name}] ${msg}`,
        agentId: agentB.persona.id,
        agentName: agentB.persona.name,
        latencyMs: 0,
      });
    }
  }

  return results;
}
