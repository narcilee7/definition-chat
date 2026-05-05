"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

const SCORE_LABELS = ["完全没有", "几天", "一半以上天数", "几乎每天"];

interface Question {
  id: string;
  text: string;
}

interface ScaleData {
  type: string;
  name: string;
  description: string;
  questions: Question[];
}

interface Result {
  assessment: any;
  interpretation: {
    severity: string;
    clinicalCutoff: boolean;
    recommendation: string;
    riskFlags: string[];
  };
}

export default function AssessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AssessPageContent />
    </Suspense>
  );
}

function AssessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scaleType, setScaleType] = useState<string | null>(null);
  const [scaleData, setScaleData] = useState<ScaleData | null>(null);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    api.assessments.list().then(setHistory).catch(console.error);
  }, []);

  useEffect(() => {
    const type = searchParams.get("type");
    if ((type === "PHQ-9" || type === "GAD-7") && !scaleType && !scaleData) {
      void loadScale(type);
    }
  }, [searchParams, scaleType, scaleData]);

  const loadScale = async (type: string) => {
    setIsLoading(true);
    try {
      const data = await api.assessments.questions(type);
      setScaleData(data);
      setScaleType(type);
      setResponses({});
      setResult(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScore = (questionId: string, score: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: score }));
  };

  const isComplete = scaleData && scaleData.questions.every((q) => responses[q.id] !== undefined);

  const handleSubmit = async () => {
    if (!scaleData || !isComplete) return;

    setIsLoading(true);
    try {
      const submission = {
        userId: "default",
        type: scaleData.type as "PHQ-9" | "GAD-7",
        responses: scaleData.questions.map((q) => ({
          questionId: q.id,
          score: responses[q.id],
          text: q.text,
        })),
        isBaseline: history.length === 0,
      };

      const res = await api.assessments.submit(submission);
      setResult(res);
      api.assessments.list().then(setHistory).catch(console.error);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minimal": return "text-green-600";
      case "mild": return "text-yellow-600";
      case "moderate": return "text-orange-600";
      case "moderately_severe":
      case "severe": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const severityLabel = (s: string) =>
    s === "minimal" ? "轻微" : s === "mild" ? "轻度" : s === "moderate" ? "中度" : s === "moderately_severe" ? "中重度" : "重度";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">情绪评估</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {!scaleType && !result && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold">情绪自评量表</h1>
              <p className="text-muted-foreground text-sm">定期评估有助于追踪你的情绪变化趋势</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadScale("PHQ-9")}>
                <CardHeader className="pb-2"><CardTitle className="text-base">PHQ-9 抑郁量表</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">9 道题，评估过去两周的抑郁症状严重程度</p></CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadScale("GAD-7")}>
                <CardHeader className="pb-2"><CardTitle className="text-base">GAD-7 焦虑量表</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">7 道题，评估过去两周的焦虑症状严重程度</p></CardContent>
              </Card>
            </div>

            {history.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">历史记录</h2>
                <div className="space-y-2">
                  {history.slice(0, 10).map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div>
                        <span className="text-sm font-medium">{h.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{new Date(h.createdAt).toLocaleDateString("zh-CN")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${getSeverityColor(h.severity)}`}>{h.totalScore} 分</span>
                        <span className="text-xs text-muted-foreground">{severityLabel(h.severity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {scaleData && !result && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-semibold">{scaleData.name}</h1>
              <p className="text-muted-foreground text-sm">{scaleData.description}</p>
              <p className="text-xs text-muted-foreground">进度：{Object.keys(responses).length} / {scaleData.questions.length}</p>
            </div>

            <div className="space-y-6">
              {scaleData.questions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <p className="text-sm font-medium">{idx + 1}. {q.text}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SCORE_LABELS.map((label, score) => (
                      <button
                        key={score}
                        onClick={() => handleScore(q.id, score)}
                        className={`p-3 rounded-xl text-sm text-left transition-colors ${responses[q.id] === score ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
                      >
                        <span className="font-medium">{score} 分</span>
                        <span className="block text-xs opacity-80">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setScaleType(null)} className="flex-1">返回</Button>
              <Button onClick={handleSubmit} disabled={!isComplete || isLoading} className="flex-1">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                提交
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h1 className="text-2xl font-semibold">评估完成</h1>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">总分</p>
                  <p className="text-4xl font-bold">{result.assessment.totalScore}</p>
                  <p className={`text-sm font-medium mt-1 ${getSeverityColor(result.interpretation.severity)}`}>
                    {severityLabel(result.interpretation.severity)}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">建议</p>
                  <p className="text-sm">{result.interpretation.recommendation}</p>
                </div>

                {result.interpretation.riskFlags.length > 0 && (
                  <div className="border-t pt-4 bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">风险提示</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">检测到自杀意念信号。请认真对待，必要时联系专业人士。</p>
                    <p className="text-xs text-red-500 mt-1">📞 全国希望 24 热线：400-161-9995</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setScaleType(null)} className="flex-1">返回量表列表</Button>
              <Button onClick={() => router.push("/progress")} className="flex-1">查看治疗档案</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
