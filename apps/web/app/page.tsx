"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModeToggle } from "@/components/mode-toggle";
import { MessageCircle, Shield, ArrowRight, Loader2, Clock } from "lucide-react";

const QUICK_TOPICS = [
  { label: "焦虑不安", prompt: "最近总是感到焦虑不安，心里七上八下的，不知道怎么回事。" },
  { label: "情绪低落", prompt: "最近情绪很低落，对什么都提不起兴趣，感觉很累。" },
  { label: "关系困扰", prompt: "我和身边人的关系出了问题，不知道该怎么处理。" },
  { label: "失眠", prompt: "最近晚上睡不着，脑子里停不下来，白天又很疲惫。" },
  { label: "工作压力", prompt: "工作压力很大，感觉自己快撑不住了。" },
  { label: "自我怀疑", prompt: "我总是觉得自己不够好，做什么都担心失败。" },
];

interface HistorySession {
  id: string;
  sessionNumber: number;
  presentingProblem: string | null;
  updatedAt: string;
  therapist: { id: string; name: string } | null;
}

export default function HomePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistorySession[]>([]);

  const canStart = input.trim().length > 0;

  useEffect(() => {
    // 加载历史会话
    api.sessions.list("default")
      .then((data) => {
        setHistory(data.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  const handleStart = async () => {
    if (!canStart || isLoading) return;
    setIsLoading(true);

    try {
      const personas = await api.personas.list();
      const defaultTherapist = personas.find((p: any) => p.isBuiltIn) || personas[0];
      if (!defaultTherapist) throw new Error("No therapist available");

      const session = await api.therapy.createSession({
        userId: "default",
        therapistId: defaultTherapist.id,
        presentingProblem: input.trim(),
      });

      router.push(`/chat/${session.sessionId}`);
    } catch (err) {
      console.error("Failed to start session:", err);
      setIsLoading(false);
    }
  };

  const handleQuickStart = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days} 天前`;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <MessageCircle className="h-5 w-5 text-primary" />
            OhMe
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/safety")}>
              <Shield className="mr-1 h-4 w-4" />
              安全计划
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              最近有什么想聊的吗？
            </h1>
            <p className="text-muted-foreground">
              一个困扰、一种情绪、一段关系——从这里开始。
            </p>
          </div>

          {/* Input */}
          <div className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="比如：最近工作压力很大，晚上睡不着，总觉得自己的状态不对劲..."
              rows={4}
              className="resize-none text-base rounded-xl"
              disabled={isLoading}
            />
            <Button
              onClick={handleStart}
              disabled={!canStart || isLoading}
              size="lg"
              className="w-full rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  准备中...
                </>
              ) : (
                <>
                  开始对话
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Quick Topics */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">或者快速开始：</p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleQuickStart(topic.prompt)}
                  className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-accent hover:border-accent"
                  disabled={isLoading}
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>最近对话</span>
              </div>
              <div className="space-y-2">
                {history.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => router.push(`/chat/${session.id}`)}
                    className="w-full text-left rounded-xl border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {session.presentingProblem || `第 ${session.sessionNumber} 次对话`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {session.therapist?.name} · {formatTime(session.updatedAt)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="border-t pt-6 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
              💬 OhMe 是结构化 AI 心理咨询，不是聊天机器人。
              <br />
              每次对话都有临床目标，对话内容受隐私保护。
              <br />
              本服务提供心理支持，但不替代专业医疗诊断和治疗。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
