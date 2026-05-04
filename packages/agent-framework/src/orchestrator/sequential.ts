import { Agent } from '../agent';
import { AgentResponse } from '../types';

/**
 * 串行执行多个 Agent
 * 前一个 Agent 的输出作为后一个的输入上下文
 */
export async function sequentialExecute(
  agents: Agent[],
  userMessage: string
): Promise<AgentResponse[]> {
  const results: AgentResponse[] = [];
  const contextMessages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: userMessage },
  ];

  for (const agent of agents) {
    try {
      const res = await agent.chatWithContext(contextMessages, '请基于以上上下文给出你的看法');
      results.push(res);
      contextMessages.push({ role: 'assistant', content: `[${agent.persona.name}] ${res.content}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Agent failed';
      results.push({
        content: `[${agent.persona.name}] ${msg}`,
        agentId: agent.persona.id,
        agentName: agent.persona.name,
        latencyMs: 0,
      });
    }
  }

  return results;
}
