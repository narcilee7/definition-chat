"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { findLens } from "@/lib/lenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

interface ExploreResponse {
  lensId: string;
  lensName: string;
  mode: "start" | "complete";
  content: string;
  latencyMs: number;
}

export default function ExplorePage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [lensId, setLensId] = useState("cognitive-judgment");
  const [userResponse, setUserResponse] = useState("");
  const [startResult, setStartResult] = useState<ExploreResponse | null>(null);
  const [completeResult, setCompleteResult] = useState<ExploreResponse | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const lens = useMemo(() => findLens(lensId), [lensId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const questionParam = params.get("question") || "";
    const lensParam = params.get("lens") || "cognitive-judgment";

    setQuestion(questionParam);
    setLensId(lensParam);

    if (questionParam) {
      setIsStarting(true);
      api.explore
        .run({ lensId: lensParam, question: questionParam })
        .then(setStartResult)
        .catch(console.error)
        .finally(() => setIsStarting(false));
    }
  }, []);

  const completeExplore = async () => {
    if (!question.trim() || !userResponse.trim() || isCompleting) return;

    setIsCompleting(true);
    try {
      const result = await api.explore.run({
        lensId,
        question,
        userResponse,
        hypothesis: startResult?.content,
      });
      setCompleteResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">Lens 深潜</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${lens?.color || "bg-primary"}`} />
            <span className="text-sm font-medium">{lens?.name || "Lens"}</span>
            <span className="text-xs text-muted-foreground">结构化探索会话</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">从一个解释假设开始，把它修正成你的语言。</h1>
          <p className="rounded-lg bg-muted p-4 text-sm leading-6">{question || "还没有问题。请先从首页发起折射。"}</p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. 解释假设</CardTitle>
          </CardHeader>
          <CardContent>
            {isStarting ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在生成这个 Lens 的第一轮假设
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-7">
                {startResult?.content || "缺少问题参数，暂时无法开始深潜。"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. 你的确认或修正</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={userResponse}
              onChange={(event) => setUserResponse(event.target.value)}
              placeholder="这个解释哪里刺中你？哪里不准确？可以从一个最近发生的场景说起。"
              rows={5}
              className="resize-none"
            />
            <Button onClick={completeExplore} disabled={!userResponse.trim() || isCompleting || !startResult}>
              {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              生成新的自我解释
            </Button>
          </CardContent>
        </Card>

        {completeResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. 新的自我解释</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="whitespace-pre-wrap text-sm leading-7">{completeResult.content}</div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={() => router.push("/")} className="flex-1">
                  回到首页
                </Button>
                <Button variant="outline" disabled className="flex-1">
                  保存到 Self Model 待接入
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
