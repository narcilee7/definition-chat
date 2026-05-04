"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useStreamChat } from "@/hooks/use-stream-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, ArrowLeft, User, Square } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  color: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<any>(null);
  const [agents, setAgents] = useState<Record<string, Agent>>({});
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isSingleAgent =
    session?.mode === "single" && session?.agentIds?.length === 1;

  const { messages, sendMessage, sendMultiMessage, isLoading, stop, initMessages } =
    useStreamChat({
      sessionId,
      agentId: session?.agentIds?.[0],
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

  const loadSession = async () => {
    try {
      const [sessionData, agentsData] = await Promise.all([
        api.sessions.get(sessionId),
        api.agents.list(),
      ]);
      setSession(sessionData);

      const agentMap: Record<string, Agent> = {};
      agentsData.forEach((a: Agent) => {
        agentMap[a.id] = a;
      });
      setAgents(agentMap);

      // Convert existing messages to our format
      const existingMessages = (sessionData.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role === "user" ? ("user" as const) : ("agent" as const),
        content: m.content,
        agentId: m.agentId,
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

    if (isSingleAgent) {
      await sendMessage(content);
    } else {
      await sendMultiMessage(content, session.agentIds);
    }
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
      <Header />

      {/* Chat Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">{session.title}</h1>
            <div className="flex gap-1.5 mt-0.5">
              {session.agentIds.map((id: string) => (
                <Badge
                  key={id}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                  style={{
                    borderColor: agents[id]?.color,
                    color: agents[id]?.color,
                  }}
                >
                  {agents[id]?.name || id}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">开始你的对话</p>
              <p className="text-muted-foreground text-sm mt-1">
                输入你的问题或感受，Agent会回应你
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const agent = msg.agentId ? agents[msg.agentId] : null;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {isUser ? (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback
                      className="text-xs text-white"
                      style={{ backgroundColor: agent?.color || "#78716C" }}
                    >
                      {(agent?.name || "A")[0]}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {!isUser && agent && (
                    <p
                      className="text-[10px] font-medium mb-1 opacity-70"
                      style={{ color: agent.color }}
                    >
                      {agent.name}
                    </p>
                  )}
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

          {isLoading && messages[messages.length - 1]?.role !== "agent" && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-muted text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </AvatarFallback>
              </Avatar>
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
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题或感受..."
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
