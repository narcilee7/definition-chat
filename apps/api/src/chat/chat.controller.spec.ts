import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

function createMockResponse() {
  const headers: Record<string, string> = {};
  const writes: string[] = [];
  return {
    setHeader: (key: string, val: string) => { headers[key] = val; },
    write: (data: string) => { writes.push(data); },
    end: vi.fn(),
    _headers: headers,
    _writes: writes,
  } as any;
}

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;

  beforeEach(() => {
    chatService = {
      chat: vi.fn().mockResolvedValue({ message: { id: '1', content: 'hello' } }),
      streamChat: vi.fn().mockImplementation(async function* () {
        yield { content: 'hi', done: false };
        yield { content: '!', done: false };
      }),
    } as unknown as ChatService;

    controller = new ChatController(chatService);
  });

  it('should return chat response', async () => {
    const result = await controller.chat({
      sessionId: 's1',
      content: 'hello',
    });
    expect(result).toEqual({ message: { id: '1', content: 'hello' } });
  });

  it('should handle chat errors', async () => {
    chatService.chat = vi.fn().mockRejectedValue(new Error('LLM down'));
    const result = await controller.chat({ sessionId: 's1', content: 'hello' });
    expect(result).toHaveProperty('error', 'LLM down');
  });

  it('should stream SSE responses', async () => {
    const res = createMockResponse();
    await controller.streamChat({ sessionId: 's1', content: 'hello' }, res);

    expect(res._headers['Content-Type']).toBe('text/event-stream');
    expect(res._writes).toContain('data: {"content":"hi","done":false}\n\n');
    expect(res._writes).toContain('data: [DONE]\n\n');
    expect(res.end).toHaveBeenCalled();
  });

  it('should handle stream errors in SSE', async () => {
    chatService.streamChat = vi.fn().mockImplementation(async function* () {
      throw new Error('stream broke');
    });

    const res = createMockResponse();
    await controller.streamChat({ sessionId: 's1', content: 'hello' }, res);

    expect(res._writes.some((w: string) => w.includes('stream broke'))).toBe(true);
    expect(res._writes).toContain('data: [DONE]\n\n');
    expect(res.end).toHaveBeenCalled();
  });
});
