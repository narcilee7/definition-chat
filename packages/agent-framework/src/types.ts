// ============================================================
// OhMe Agent Framework — Core Types
// ============================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  timeoutMs?: number;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface LLMProvider {
  readonly name: string;
  chat(
    messages: ChatMessage[],
    options?: ChatOptions,
    tools?: Array<{ name: string; description: string; parameters: unknown }>,
  ): Promise<{ content: string; toolCalls?: Array<{ id: string; name: string; arguments: string }> }>;
  stream?(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk>;
}

export interface MemoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Memory {
  add(message: MemoryMessage): Promise<void>;
  get(limit?: number): Promise<MemoryMessage[]>;
  getContext(query?: string, limit?: number): Promise<MemoryMessage[]>;
  clear(): Promise<void>;
}

export type MemoryType = 'buffer' | 'window' | 'sqlite';

export interface MemoryConfig {
  type: MemoryType;
  maxMessages?: number;
  maxTokens?: number;
  sessionId?: string;
}

export interface AgentPersona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  color?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: string;
  memory?: MemoryConfig;
}

export interface AgentResponse {
  content: string;
  agentId: string;
  agentName: string;
  latencyMs: number;
}

export interface MultiAgentRequest {
  personaIds: string[];
  userMessage: string;
  mode: 'parallel' | 'sequential' | 'debate';
}

export type ProviderName =
  | 'siliconflow'
  | 'deepseek'
  | 'groq'
  | 'openrouter'
  | 'openai-compatible';

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  name: string;
}
