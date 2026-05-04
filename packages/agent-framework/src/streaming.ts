import { StreamChunk } from './types';

interface SSEChoice {
  delta?: {
    content?: string;
  };
}

interface SSEData {
  choices?: SSEChoice[];
}

/**
 * 将 SSE (Server-Sent Events) ReadableStream 解析为 AsyncIterable<StreamChunk>
 */
export async function* parseSSEStream(
  response: Response,
): AsyncGenerator<StreamChunk> {
  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const chunk = parseSSELine(line.trim());
        if (chunk) yield chunk;
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      const chunk = parseSSELine(buffer.trim());
      if (chunk) yield chunk;
    }
  } finally {
    reader.releaseLock();
  }
}

function parseSSELine(line: string): StreamChunk | null {
  if (!line.startsWith('data: ')) return null;

  const data = line.slice(6).trim();
  if (data === '[DONE]') {
    return { content: '', done: true };
  }

  try {
    const parsed = JSON.parse(data) as SSEData;
    const content = parsed.choices?.[0]?.delta?.content || '';
    return { content, done: false };
  } catch {
    return null;
  }
}
