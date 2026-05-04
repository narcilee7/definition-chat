import { ChatMessage } from './types';
import { BaseProvider } from './providers/base';

/**
 * Structured Output — 强制 LLM 返回 JSON
 * 通过 system prompt 注入 JSON 指令 + response_format
 */

export interface JSONSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

export async function generateJSON<T = Record<string, unknown>>(
  provider: BaseProvider,
  messages: ChatMessage[],
  schema: JSONSchema,
  options?: {
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  },
): Promise<T> {
  const schemaDescription = JSON.stringify(schema, null, 2);

  const systemPrompt = `你必须以 JSON 格式回复，严格遵守以下 JSON Schema：

${schemaDescription}

要求：
- 只输出纯 JSON，不要有任何 markdown 代码块标记（不要 \`\`\`json）
- 不要输出任何解释性文字
- 确保所有 required 字段都存在
- 如果字段值不确定，用 null 或空字符串填充`;

  const augmentedMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.filter((m) => m.role !== 'system'),
  ];

  const content = await provider.chat(augmentedMessages, {
    temperature: options?.temperature ?? 0.3,
    maxTokens: options?.maxTokens ?? 1024,
    timeoutMs: options?.timeoutMs ?? 15000,
  });

  // Clean markdown code blocks if present
  const cleaned = content.content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/gi, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse JSON response: ${err instanceof Error ? err.message : String(err)}\nRaw: ${cleaned.slice(0, 500)}`
    );
  }
}

/**
 * 从 Agent 的 system prompt 中提取结构化输出
 * 用于 Builder 等场景
 */
export async function extractStructured<T = Record<string, unknown>>(
  provider: BaseProvider,
  text: string,
  instruction: string,
  schema: JSONSchema,
): Promise<T> {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: `请从以下文本中提取信息，严格按照 JSON Schema 输出。

提取指令：${instruction}

文本内容：
---
${text}
---`,
    },
  ];

  return generateJSON<T>(provider, messages, schema);
}
