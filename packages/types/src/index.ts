// ============================================================
// OhMe — Shared Type Definitions
// ============================================================

// ----- Agent / Persona -----

export type AgentTone =
  | "analytical"   // 理性分析
  | "warm"         // 温暖接纳
  | "sharp"        // 锐利直接
  | "intuitive"    // 直觉感知
  | "playful"      // 活泼轻松
  | "grounded";    // 沉稳扎实

export type AgentRole =
  | "inner_analyst"     // 内在分析师
  | "healer"            // 疗愈师
  | "challenger"        // 挑战者
  | "intuitive"         // 直觉者
  | "companion"         // 陪伴者
  | "mentor"            // 导师
  | "custom";           // 自定义

export interface AgentTrait {
  key: string;
  value: string;
}

export interface AgentProtocol {
  id: string;
  name: string;
  role: AgentRole;
  tone: AgentTone;
  avatar?: string;
  color: string;
  description: string;
  coreTraits: AgentTrait[];
  communicationStyle: string;
  expertise: string[];        // 擅长处理的问题类型
  backgroundStory?: string;   // 人格背景故事
  openingStyle: string;       // 开场白风格
  lengthPreference: "minimal" | "concise" | "moderate" | "detailed";
  forbiddenTopics: string[];
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

// ----- Chat -----

export type MessageRole = "user" | "agent" | "system" | "builder";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  agentId?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title?: string;
  mode: "single" | "multi" | "build";
  agentIds: string[];
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ----- API -----

export interface ChatRequest {
  sessionId: string;
  agentId: string;
  content: string;
}

export interface ChatResponse {
  message: ChatMessage;
}

export interface MultiChatRequest {
  sessionId: string;
  agentIds: string[];
  content: string;
}

export interface MultiChatResponse {
  messages: ChatMessage[];
}

export interface BuildAgentRequest {
  sessionId: string;
  content: string;
}

export interface BuildAgentResponse {
  message: ChatMessage;
  draftAgent?: Partial<AgentProtocol>;
}

export interface ConfirmAgentRequest {
  draft: AgentProtocol;
}

// ----- Colors -----

export const AGENT_COLOR_PALETTE = [
  "#2563EB", // blue
  "#7C3AED", // violet
  "#059669", // emerald
  "#DC2626", // red
  "#D97706", // amber
  "#0891B2", // cyan
  "#BE185D", // pink
  "#4338CA", // indigo
] as const;

// ----- Builder Flow -----

export type BuildStage =
  | "greeting"
  | "discover_role"
  | "discover_tone"
  | "discover_traits"
  | "discover_expertise"
  | "discover_story"
  | "review"
  | "confirm";

export interface BuilderState {
  stage: BuildStage;
  draft: Partial<AgentProtocol>;
  history: ChatMessage[];
}
