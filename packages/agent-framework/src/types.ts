// ============================================================
// OhMe Agent Framework — Core Types
// ============================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  timeoutMs?: number;
}

export interface LLMProvider {
  readonly name: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
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
