"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSessions } from "@/hooks/use-sessions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModeToggle } from "@/components/mode-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Sparkles, Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { data: sessions } = useSessions();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const session = await api.sessions.create({
        intent: input.trim().slice(0, 100),
      });
      router.push(`/chat/${session.id}`);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  const quickPrompts = [
    "我最近工作压力好大",
    "我和家人的关系让我疲惫",
    "我不知道自己想要什么",
    "做了个奇怪的梦",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" />
            OhMe
          </div>
          <ModeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl space-y-8">
          {/* Hero */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              今天，是什么在困扰你？
            </h1>
            <p className="text-muted-foreground text-sm">
              不用想太多，就像和一个懂你的朋友聊天
            </p>
          </div>

          {/* Input */}
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="随便说说..."
              rows={3}
              disabled={isLoading}
              className="min-h-[80px] resize-none rounded-2xl pr-14 text-base"
            />
            <Button
              onClick={handleStart}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="absolute bottom-3 right-3 h-9 w-9 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-2 justify-center">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="px-3 py-1.5 rounded-full text-xs bg-muted hover:bg-accent transition-colors text-muted-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Recent sessions */}
      {sessions && sessions.length > 0 && (
        <div className="border-t bg-muted/30">
          <div className="max-w-xl mx-auto px-4 py-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              继续探索
            </h2>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {sessions.slice(0, 10).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => router.push(`/chat/${session.id}`)}
                    className="w-full text-left p-3 rounded-xl bg-background hover:bg-accent transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {session.notes
                        ? session.notes.slice(0, 60) + "..."
                        : new Date(session.updatedAt).toLocaleDateString("zh-CN")}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
