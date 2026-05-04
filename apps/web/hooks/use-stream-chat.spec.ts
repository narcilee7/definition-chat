import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamChat } from './use-stream-chat';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useStreamChat', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() =>
      useStreamChat({ sessionId: 'test-session' })
    );
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should add user message and handle null body gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: null,
    });

    const { result } = renderHook(() =>
      useStreamChat({ sessionId: 'test-session' })
    );

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('hello');
    expect(result.current.isLoading).toBe(false);
  });

  it('should stream assistant response', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"content":"hi"}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      body: stream,
    });

    const { result } = renderHook(() =>
      useStreamChat({ sessionId: 'test-session' })
    );

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toBe('hi');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'server error' }),
    });

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useStreamChat({ sessionId: 'test-session', onError })
    );

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].content).toContain('❌');
    expect(result.current.isLoading).toBe(false);
  });

  it('should reset loading state on stop', () => {
    const { result } = renderHook(() =>
      useStreamChat({ sessionId: 'test-session' })
    );

    act(() => {
      result.current.stop();
    });

    expect(result.current.isLoading).toBe(false);
  });
});
