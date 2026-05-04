/**
 * InsightEngine Prompts — 对话结束后的洞察提取
 */

/**
 * 生成 session 摘要
 */
export function sessionNotesPrompt(transcript: string): string {
  return `你是一位资深心理咨询师。请根据以下对话记录，用3-5句话写一段 session 摘要。捕捉核心情绪、关键发现、用户展现的模式。语言要温暖、专业、准确。

对话记录：
${transcript}`;
}

/**
 * 从对话中提取 MemoryNote 的系统提示
 */
export const MEMORY_EXTRACTION_SYSTEM = `从对话中提取值得长期记忆的洞察。只输出纯 JSON，严格遵守以下 JSON Schema：

{
  "type": "object",
  "properties": {
    "notes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "content": { "type": "string" },
          "confidence": { "type": "number" }
        },
        "required": ["type", "content", "confidence"]
      }
    }
  },
  "required": ["notes"]
}

要求：
- 只输出纯 JSON，不要有任何 markdown 代码块标记
- 每个 note 的 type 是自由标签（如 emotion, belief, pattern, event, relationship, value, fear, desire 等）
- 只提取高置信度、有持久价值的洞察，不要提取琐碎信息`;

/**
 * 构建记忆提取的用户消息
 */
export function memoryExtractionPrompt(transcript: string): string {
  return transcript;
}

/**
 * 更新用户画像的系统提示
 */
export const PROFILE_UPDATE_SYSTEM = `你是一位心理咨询师。你的任务是为用户维护一份"心理画像"——一段自然语言描述，概括这个人的核心特征、情绪模式、关注议题和沟通偏好。画像应该简洁、准确、温暖。`;

export interface ProfileUpdateInput {
  existingProfile?: string;
  recentNotes?: string;
  transcript?: string;
}

/**
 * 构建更新用户画像的 prompt
 */
export function profileUpdatePrompt(input: ProfileUpdateInput): string {
  if (input.existingProfile) {
    return `当前用户画像：\n${input.existingProfile}\n\n最近会话摘要：\n${input.recentNotes || ''}\n\n请基于以上信息和新对话，更新用户画像。保持简洁（200字以内），捕捉核心特征。`;
  }
  return `请根据以下对话记录，写一段简洁的用户画像（200字以内），捕捉这个人的核心特征、情绪模式、关注议题。\n\n对话记录：\n${input.transcript || ''}`;
}
