"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { findLens, getCustomLensPayload, LensOption } from "@/lib/lenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowLeft, Check, Loader2, RotateCcw, Save, Sparkles } from "lucide-react";

const PHASES = [
  { key: "clarify", label: "澄清", description: "确认问题" },
  { key: "identify", label: "识别", description: "标记信号" },
  { key: "hypothesize", label: "假设", description: "提出解释" },
  { key: "validate", label: "确认", description: "修正假设" },
  { key: "reframe", label: "重构", description: "新解释" },
  { key: "experiment", label: "实验", description: "小行动" },
  { key: "complete", label: "完成", description: "收束" },
];

interface SessionMessage {
  id: string;
  role: string;
  content: string;
  phase: string;
}

interface ExplorationSession {
  id: string;
  lensId: string;
  lensName: string;
  originalQuestion: string;
  phase: string;
  newNarrative?: string | null;
  selectedExperiment?: string | null;
  messages: SessionMessage[];
  completedAt?: string | null;
}

function ExplorePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [question, setQuestion] = useState("");
  const [lensId, setLensId] = useState("cognitive-judgment");
  const [lens, setLens] = useState<LensOption | undefined>();
  const [session, setSession] = useState<ExplorationSession | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saved, setSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 从 URL 参数初始化
  useEffect(() => {
    const q = searchParams.get("question") || "";
    const l = searchParams.get("lens") || "cognitive-judgment";
    setQuestion(q);
    setLensId(l);
    setLens(findLens(l));

    if (q && l) {
      createSession(q, l);
    }
  }, [searchParams]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  const createSession = async (q: string, lid: string) => {
    setIsCreating(true);
    try {
      const customLens = getCustomLensPayload([lid])[0];
      const newSession = await api.exploration.create({
        userId: "default",
        lensId: lid,
        question: q,
        customLens,
      });
      setSession(newSession);
    } catch (err) {
      console.error("Failed to create session:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const sendMessage = async () => {
    if (!session || !userInput.trim() || isLoading) return;

    setIsLoading(true);
    const input = userInput.trim();
    setUserInput("");

    try {
      const result = await api.exploration.sendMessage(session.id, { userInput: input });
      setSession(result.session);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToSelfModel = async () => {
    if (!session) return;
    try {
      await api.exploration.save(session.id);
      setSaved(true);
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  const reset = () => {
    setSession(null);
    setSaved(false);
    setUserInput("");
    if (question && lensId) {
      createSession(question, lensId);
    }
  };

  const currentPhaseIndex = PHASES.findIndex((p) => p.key === (session?.phase || "clarify"));
  const phaseLabel = PHASES[currentPhaseIndex]?.label || "探索";
  const phaseDescription = PHASES[currentPhaseIndex]?.description || "";
  const isComplete = session?.phase === "complete";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${lens?.color || "bg-primary"}`} />
              <span className="text-sm font-medium">{lens?.name || "Lens"} 深潜</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session && (
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                重新开始
              </Button>
            )}
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {!session && isCreating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">正在启动结构化深潜...</p>
          </div>
        ) : !session ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <p className="text-muted-foreground">缺少问题参数</p>
            <Button onClick={() => router.push("/")}>回到首页</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 阶段进度条 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {phaseLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">{phaseDescription}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {currentPhaseIndex + 1} / {PHASES.length}
                </span>
              </div>
              <div className="flex gap-1">
                {PHASES.map((p, i) => (
                  <div
                    key={p.key}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= currentPhaseIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 原问题 */}
            <div className="rounded-lg bg-muted px-4 py-3">
              <p className="text-xs text-muted-foreground">原问题</p>
              <p className="text-sm font-medium">{session.originalQuestion}</p>
            </div>

            {/* 消息对话流 */}
            <div className="space-y-4">
              {session.messages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  {msg.role === "lens" && (
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${lens?.color || "bg-primary"}`} />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {PHASES.find((p) => p.key === msg.phase)?.label || msg.phase}
                      </span>
                    </div>
                  )}
                  <Card className={msg.role === "user" ? "ml-8 border-l-4 border-l-primary/30" : ""}>
                    <CardContent className="py-4">
                      <div className="whitespace-pre-wrap text-sm leading-7">{msg.content}</div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {lens?.name || "Lens"} 正在思考...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区 */}
            {!isComplete && (
              <div className="space-y-3">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={`回应 ${lens?.name || "Lens"}...`}
                  rows={3}
                  className="resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <div className="flex justify-end">
                  <Button onClick={sendMessage} disabled={!userInput.trim() || isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    发送
                  </Button>
                </div>
              </div>
            )}

            {/* 完成后的操作 */}
            {isComplete && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Check className="h-4 w-4 text-primary" />
                    深潜完成
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {session.newNarrative && (
                    <div className="rounded-lg bg-background p-4">
                      <p className="text-xs text-muted-foreground">新的自我解释</p>
                      <p className="mt-1 text-sm font-medium leading-6">{session.newNarrative}</p>
                    </div>
                  )}
                  {session.selectedExperiment && (
                    <div className="rounded-lg bg-background p-4">
                      <p className="text-xs text-muted-foreground">选择的小实验</p>
                      <p className="mt-1 text-sm leading-6">{session.selectedExperiment}</p>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" onClick={reset} className="flex-1">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      再来一次
                    </Button>
                    <Button variant="outline" onClick={saveToSelfModel} disabled={saved} className="flex-1">
                      {saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                      {saved ? "已保存" : "保存到 Self Model"}
                    </Button>
                    <Button onClick={() => router.push("/model")} className="flex-1">
                      查看 Self Model
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ExplorePageInner />
    </Suspense>
  );
}
