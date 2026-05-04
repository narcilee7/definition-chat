export interface CoreCognition {
  habit: string;
}

export type Tone = 'cold' | 'warm' | 'intense' | 'empty' | 'astringent';
export type LengthPreference = 'minimal' | 'concise' | 'moderate' | 'detailed';

export interface LanguageHabit {
  tone: Tone;
  lengthPreference: LengthPreference;
  forbiddenWords: string[];
}

export interface ResponsePattern {
  firstMove: string;
  silenceAllowed: boolean;
  retreatSignal?: string;
}

export type Taboo =
  | 'no_advice'
  | 'no_empathy'
  | 'no_explanation'
  | 'no_comfort'
  | 'no_judgment';

export interface StanceProtocol {
  id: string;
  name: string;
  era: string;
  coreCognition: CoreCognition[];
  languageHabit: LanguageHabit;
  responsePattern: ResponsePattern;
  taboos: Taboo[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RefractionRequest {
  question: string;
  stanceIds: string[];
}

export interface RefractionResult {
  stanceId: string;
  stanceName: string;
  content: string;
  latency: number;
}

export interface ChatRequest {
  stanceId: string;
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  content: string;
  stance: string;
}

export const STANCE_COLORS: Record<string, string> = {
  russell: '#2563EB',  // blue-600
  jung: '#7C3AED',     // violet-600
  stoic: '#4B5563',    // gray-600
  laozi: '#059669',    // emerald-600
};

export const STANCE_LABELS: Record<string, string> = {
  russell: '罗素·幸福之路',
  jung: '荣格·分析心理学',
  stoic: '斯多葛·爱比克泰德',
  laozi: '老子·道德经',
};
