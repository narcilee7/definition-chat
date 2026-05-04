// ============================================================
// OhMe Agent Framework — Configuration
// ============================================================

import { ProviderName } from './types';

export interface AgentFrameworkConfig {
  defaultProvider: ProviderName;
  providers: Record<string, ProviderEnvConfig>;
}

export interface ProviderEnvConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

function env(key: string, fallback = ''): string {
  return process.env[key] || fallback;
}

export function loadConfig(): AgentFrameworkConfig {
  return {
    defaultProvider: (env('DEFAULT_LLM_PROVIDER', 'siliconflow') as ProviderName),
    providers: {
      siliconflow: {
        apiKey: env('SILICONFLOW_API_KEY'),
        baseUrl: env('SILICONFLOW_BASE_URL', 'https://api.siliconflow.cn/v1'),
        model: env('SILICONFLOW_MODEL', 'Qwen/Qwen2.5-7B-Instruct'),
      },
      deepseek: {
        apiKey: env('DEEPSEEK_API_KEY'),
        baseUrl: env('DEEPSEEK_BASE_URL', 'https://api.deepseek.com/v1'),
        model: env('DEEPSEEK_MODEL', 'deepseek-chat'),
      },
      groq: {
        apiKey: env('GROQ_API_KEY'),
        baseUrl: env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
        model: env('GROQ_MODEL', 'llama-3.1-8b-instant'),
      },
      openrouter: {
        apiKey: env('OPENROUTER_API_KEY'),
        baseUrl: env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
        model: env('OPENROUTER_MODEL', 'anthropic/claude-3.5-haiku'),
      },
      'openai-compatible': {
        apiKey: env('OPENAI_COMPAT_API_KEY'),
        baseUrl: env('OPENAI_COMPAT_BASE_URL', 'https://api.openai.com/v1'),
        model: env('OPENAI_COMPAT_MODEL', 'gpt-3.5-turbo'),
      },
    },
  };
}

// Singleton config instance
let _config: AgentFrameworkConfig | null = null;

export function getConfig(): AgentFrameworkConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}

export function setConfig(config: AgentFrameworkConfig): void {
  _config = config;
}
