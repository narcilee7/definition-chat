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
  const raw = env('DEFAULT_LLM_PROVIDER', 'siliconflow');
  const defaultProvider = Object.values(ProviderName).includes(raw as ProviderName)
    ? (raw as ProviderName)
    : ProviderName.SiliconFlow;

  return {
    defaultProvider,
    providers: {
      [ProviderName.SiliconFlow]: {
        apiKey: env('SILICONFLOW_API_KEY'),
        baseUrl: env('SILICONFLOW_BASE_URL', 'https://api.siliconflow.cn/v1'),
        model: env('SILICONFLOW_MODEL', 'Qwen/Qwen2.5-7B-Instruct'),
      },
      [ProviderName.DeepSeek]: {
        apiKey: env('DEEPSEEK_API_KEY'),
        baseUrl: env('DEEPSEEK_BASE_URL', 'https://api.deepseek.com/v1'),
        model: env('DEEPSEEK_MODEL', 'deepseek-chat'),
      },
      [ProviderName.Groq]: {
        apiKey: env('GROQ_API_KEY'),
        baseUrl: env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
        model: env('GROQ_MODEL', 'llama-3.1-8b-instant'),
      },
      [ProviderName.OpenRouter]: {
        apiKey: env('OPENROUTER_API_KEY'),
        baseUrl: env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
        model: env('OPENROUTER_MODEL', 'anthropic/claude-3.5-haiku'),
      },
      [ProviderName.OpenAICompatible]: {
        apiKey: env('OPENAI_COMPAT_API_KEY'),
        baseUrl: env('OPENAI_COMPAT_BASE_URL', 'https://api.openai.com/v1'),
        model: env('OPENAI_COMPAT_MODEL', 'gpt-3.5-turbo'),
      },
    },
  };
}

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
