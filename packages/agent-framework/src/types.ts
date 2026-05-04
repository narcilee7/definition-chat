// ============================================================
// OhMe Agent Framework — Core Types
// ============================================================

export enum MemoryType {
  Buffer = 'buffer',
  Window = 'window',
  SQLite = 'sqlite',
}

export enum ProviderName {
  SiliconFlow = 'siliconflow',
  DeepSeek = 'deepseek',
  Groq = 'groq',
  OpenRouter = 'openrouter',
  OpenAICompatible = 'openai-compatible',
}

export enum AgentState {
  Idle = 'idle',
  Thinking = 'thinking',
  CallingTool = 'calling_tool',
  Streaming = 'streaming',
  Error = 'error',
  Paused = 'paused',
}

export enum EventType {
  ChatStart = 'chat:start',
  ChatEnd = 'chat:end',
  ChatError = 'chat:error',
  ChatStream = 'chat:stream',
  ProviderCall = 'provider:call',
  ProviderSuccess = 'provider:success',
  ProviderError = 'provider:error',
  ProviderCircuitOpen = 'provider:circuit-open',
  MemoryRead = 'memory:read',
  MemoryWrite = 'memory:write',
  RegistryRegister = 'registry:register',
  RegistryRemove = 'registry:remove',
  ToolCall = 'tool:call',
  ToolSuccess = 'tool:success',
  ToolError = 'tool:error',
  AgentInit = 'agent:init',
  AgentError = 'agent:error',
  AgentDestroy = 'agent:destroy',
}

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

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  name: string;
}
