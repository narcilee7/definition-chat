"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModeToggle } from "@/components/mode-toggle";
import { Send, Loader2, ArrowLeft, ShieldAlert, Star, Settings } from "lucide-react";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  techniqueUsed?: string;
  riskFlag?: boolean;
  createdAt: string;
}

function RiskWarningText({ riskLevel }: { riskLevel: string }) {
  const levelLabel =
    riskLevel === "high" ? "高" : riskLevel === "imminent" ? "紧急" : "中";
  return (
    <span>
      检测到风险信号（{levelLabel}风险）。如需帮助，请联系 24 小时热线：400-161-9995
    </span>
  );
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<any>(null);
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [riskLevel, setRiskLevel] = useState("none");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialMessageSentRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const loadSession = async () => {
    try {
      const sessionData = await api.therapy.getSession(sessionId);
      setSession(sessionData);
      setRiskLevel(sessionData.riskLevel || "none");
      setFeedbackSent(Boolean(sessionData.allianceRating));
      if (sessionData.messages) {
        setMessages(sessionData.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsInitLoading(false);
    }
  };

  const sendContent = async (rawContent: string) => {
    if (!rawContent.trim() || isLoading) return;
    const content = rawContent.trim();
    setInput("");

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const agentMsgId = `agent-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: agentMsgId,
        role: "therapist",
        content: "",
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await api.therapy.stream({ sessionId, content });
      const reader = res.body!.getReader();
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
            if (parsed.done) {
              if (parsed.riskLevel) setRiskLevel(parsed.riskLevel);
              if (parsed.technique) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === agentMsgId
                      ? { ...msg, techniqueUsed: parsed.technique }
                      : msg
                  )
                );
              }
              continue;
            }
            const chunk = parsed.content || "";
            fullContent += chunk;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === agentMsgId ? { ...msg, content: fullContent } : msg
              )
            );

            if (parsed.riskLevel) setRiskLevel(parsed.riskLevel);
          } catch {
            // ignore parse errors
          }
        }
      }

      // Reload session state
      setTimeout(loadSession, 500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "发送失败";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? { ...msg, content: `❌ ${errorMsg}` }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    await sendContent(input);
  };

  useEffect(() => {
    const shouldStart = searchParams.get("start") === "1";
    const presentingProblem = session?.presentingProblem?.trim();
    if (
      !shouldStart ||
      !presentingProblem ||
      messages.length > 0 ||
      isLoading ||
      initialMessageSentRef.current
    ) {
      return;
    }

    initialMessageSentRef.current = true;
    router.replace(`/chat/${sessionId}`);
    void sendContent(presentingProblem);
  }, [searchParams, session, messages.length, isLoading, router, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const submitFeedback = async (score: number) => {
    if (feedbackSent) return;
    setFeedbackSent(true);
    try {
      await api.sessions.feedback(sessionId, { allianceRating: score });
    } catch (err) {
      console.error(err);
      setFeedbackSent(false);
    }
  };

  const completeSession = async () => {
    if (isCompleting || isLoading) return;
    setIsCompleting(true);
    try {
      const result = await api.therapy.completeSession(sessionId);
      setSession((prev: any) => ({ ...prev, ...result }));
      await loadSession();
      router.push("/progress");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompleting(false);
    }
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case "high":
      case "imminent":
        return "text-red-500";
      case "moderate":
        return "text-orange-500";
      default:
        return "text-muted-foreground";
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
      {/* Header — V5: 极简，去掉阶段指示器 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-3xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {session.therapist?.name || "OhMe"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {riskLevel !== "none" && (
              <ShieldAlert className={`h-4 w-4 ${getRiskColor()}`} />
            )}
            <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4" />
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Welcome */}
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <p className="text-muted-foreground">
                {session.presentingProblem
                  ? `我们在聊：${session.presentingProblem}`
                  : "慢慢来，想说什么都可以。"}
              </p>
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
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {messages.some((msg) => msg.role === "therapist" && msg.content.trim()) && !isLoading && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
                <span>{feedbackSent ? "已记录" : "这次对话有帮助吗"}</span>
                {!feedbackSent && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => submitFeedback(score)}
                        className="rounded p-1 transition-colors hover:bg-accent hover:text-foreground"
                        aria-label={`${score} 分`}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {isLoading && messages[messages.length - 1]?.role !== "therapist" && (
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

      {/* Risk Warning */}
      {riskLevel !== "none" && (
        <div className="border-t bg-red-50 dark:bg-red-950/20 px-4 py-2">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs text-red-600">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <RiskWarningText riskLevel={riskLevel} />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="继续对话..."
              rows={1}
              disabled={isLoading}
              className="min-h-[44px] resize-none rounded-xl"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-10 w-10 rounded-xl flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            {isLoading ? "生成中..." : "Enter 发送 · Shift + Enter 换行"}
          </p>
          {messages.some((msg) => msg.role === "therapist" && msg.content.trim()) && (
            <div className="mt-3 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={completeSession}
                disabled={isLoading || isCompleting}
              >
                {isCompleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                结束本次并生成小结
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
