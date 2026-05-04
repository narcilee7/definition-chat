"use client";

import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  createdAt?: string;
}

interface UseStreamChatOptions {
  sessionId: string;
  onError?: (error: string) => void;
}

export function useStreamChat({ sessionId, onError }: UseStreamChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const initMessages = useCallback((initial: ChatMessage[]) => {
    setMessages(initial);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const agentMsgId = `agent-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: agentMsgId,
          role: "assistant",
          content: "",
          isStreaming: true,
        },
      ]);

      try {
        const abort = new AbortController();
        abortRef.current = abort;

        const res = await api.chat.stream({
          sessionId,
          content: content.trim(),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        if (!res.body) {
          throw new Error("No response body");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              const chunk = parsed.content || "";
              fullContent += chunk;

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === agentMsgId
                    ? { ...msg, content: fullContent, isStreaming: true }
                    : msg
                )
              );
            } catch {
              // ignore parse errors
            }
          }
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentMsgId
              ? { ...msg, content: fullContent, isStreaming: false }
              : msg
          )
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "发送失败";
        onError?.(errorMsg);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentMsgId
              ? { ...msg, content: `❌ ${errorMsg}`, isStreaming: false }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [sessionId, isLoading, onError]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      )
    );
  }, []);

  return { messages, sendMessage, isLoading, stop, initMessages };
}
