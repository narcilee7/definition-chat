'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getStanceById } from '@/lib/definition';
import { STANCE_COLORS, ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

export default function DivePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const stanceId = params.stanceId as string;
  const question = searchParams.get('question') || '';

  const stance = getStanceById(stanceId);
  const color = STANCE_COLORS[stanceId] || '#78716C';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Send initial question if coming from refraction
  useEffect(() => {
    if (question && messages.length === 0) {
      handleSend(question);
    }
  }, [question]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stanceId,
          message: text.trim(),
          history: messages,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '这位思想家此刻沉默');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.content },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '这位思想家此刻沉默';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: msg },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setShowClearConfirm(false);
  };

  if (!stance) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <p className="text-[#78716C]">立场不存在</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#FAFAF9]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#FAFAF9]/90 backdrop-blur-sm border-b border-[#e7e5e4]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            ← 返回
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-[#1C1917]">{stance.name}</h1>
            <span className="text-xs text-[#78716C]">{stance.era}</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowClearConfirm(!showClearConfirm)}
              className="text-sm text-[#78716C] hover:text-red-500 transition-colors"
            >
              清空
            </button>
            {showClearConfirm && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-[#e7e5e4] rounded-lg shadow-lg p-3 w-40 z-20">
                <p className="text-xs text-[#78716C] mb-2">确定清空对话？</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClear}
                    className="flex-1 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    确定
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-1 text-xs border border-[#e7e5e4] rounded hover:bg-[#f5f5f4] transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 && !question && (
            <div className="text-center py-20">
              <p className="text-[#d6d3d1] text-lg">输入你的问题，开始深潜</p>
            </div>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={cn(
                  'flex',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-5 py-3.5 text-base leading-relaxed',
                    isUser
                      ? 'bg-[#1C1917] text-white'
                      : 'bg-white border border-[#e7e5e4] text-[#1C1917]'
                  )}
                  style={
                    !isUser
                      ? { borderLeftWidth: '4px', borderLeftColor: color }
                      : undefined
                  }
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div
                className="bg-white border border-[#e7e5e4] rounded-2xl px-5 py-3.5"
                style={{ borderLeftWidth: '4px', borderLeftColor: color }}
              >
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#d6d3d1] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#d6d3d1] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#d6d3d1] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-[#FAFAF9]/90 backdrop-blur-sm border-t border-[#e7e5e4]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="继续对话，或离开"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl border-2 border-[#e7e5e4] bg-white p-3.5 text-base text-[#1C1917] placeholder:text-[#d6d3d1] focus:outline-none focus:border-[#a8a29e] transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 bg-[#1C1917] text-white text-sm font-medium rounded-xl hover:bg-[#44403C] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
          <p className="text-xs text-[#d6d3d1] mt-2 text-center">
            Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>
    </main>
  );
}
