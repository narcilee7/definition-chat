"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useStreamChat } from "@/hooks/use-stream-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModeToggle } from "@/components/mode-toggle";
import { Send, Loader2, ArrowLeft, Square, Sparkles } from "lucide-react";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const initialMsg = searchParams.get("initialMsg");

  const [session, setSession] = useState<any>(null);
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialSent = useRef(false);

  const { messages, sendMessage, isLoading, stop, initMessages } = useStreamChat({
    sessionId,
    onError: (err) => console.error(err),
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (sessionId === "new") return;
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Send initial message if provided via URL
  useEffect(() => {
    if (initialMsg && !initialSent.current && !isInitLoading && session) {
      initialSent.current = true;
      sendMessage(initialMsg);
      // Clean URL
      router.replace(`/chat/${sessionId}`, { scroll: false });
    }
  }, [initialMsg, isInitLoading, session, sessionId, sendMessage, router]);

  const loadSession = async () => {
    try {
      const sessionData = await api.sessions.get(sessionId);
      setSession(sessionData);
      const existingMessages = (sessionData.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
        createdAt: m.createdAt,
      }));
      initMessages(existingMessages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInitLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !session) return;
    const content = input.trim();
    setInput("");
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isInitLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">会话不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">OhMe</span>
            </div>
          </div>
          <ModeToggle />
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">开始你的探索</p>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="leading-relaxed">
                      <MarkdownRenderer content={msg.content} />
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/60 animate-pulse align-middle rounded-sm" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-background">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="继续说..."
              rows={1}
              disabled={isLoading}
              className="min-h-[44px] resize-none rounded-xl"
            />
            <Button
              onClick={isLoading ? stop : handleSend}
              disabled={!isLoading && !input.trim()}
              size="icon"
              className="h-10 w-10 rounded-xl flex-shrink-0"
            >
              {isLoading ? (
                <Square className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            {isLoading ? "点击方块停止生成" : "Enter 发送 · Shift + Enter 换行"}
          </p>
        </div>
      </div>
    </div>
  );
}
