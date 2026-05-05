"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { findLens, LENS_OPTIONS } from "@/lib/lenses";
import { ArrowLeft, Loader2, RotateCcw, Sparkles } from "lucide-react";

interface LensRefractionResult {
  lensId: string;
  lensName: string;
  content: string;
  latencyMs: number;
}

export default function ReflectPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [selectedLensIds, setSelectedLensIds] = useState<string[]>([
    "cognitive-judgment",
    "relationship-pattern",
    "shame",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LensRefractionResult[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const questionParam = params.get("question");
    const lensesParam = params.get("lenses");
    let nextLensIds = selectedLensIds;

    if (questionParam) setQuestion(questionParam);
    if (lensesParam) {
      const ids = lensesParam.split(",").filter((id) => findLens(id));
      if (ids.length > 0) {
        nextLensIds = ids;
        setSelectedLensIds(ids);
      }
    }

    if (questionParam && nextLensIds.length > 0) {
      setIsLoading(true);
      api.refraction
        .analyze({
          userId: "default",
          question: questionParam,
          lensIds: nextLensIds,
        })
        .then(setResults)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
    // Only hydrate from URL on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLens = (id: string) => {
    setSelectedLensIds((prev) =>
      prev.includes(id) ? prev.filter((lensId) => lensId !== id) : [...prev, id],
    );
  };

  const handleReflect = async () => {
    if (!question.trim() || selectedLensIds.length === 0 || isLoading) return;

    setIsLoading(true);
    try {
      const response = await api.refraction.analyze({
        userId: "default",
        question: question.trim(),
        lensIds: selectedLensIds,
      });
      setResults(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">Lens 折射</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {!results && (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">把问题投向几个解释视角</h1>
              <p className="text-sm text-muted-foreground">
                每个 Lens 都会给出自己的理解、盲区、关键问题和一个小探索动作。
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">你的问题或困扰</label>
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="描述一个你想重新理解的问题..."
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">选择 Lens</label>
                <span className="text-xs text-muted-foreground">已选择 {selectedLensIds.length} 个</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {LENS_OPTIONS.map((lens) => {
                  const selected = selectedLensIds.includes(lens.id);
                  return (
                    <button
                      key={lens.id}
                      type="button"
                      onClick={() => toggleLens(lens.id)}
                      className={`rounded-lg border p-3 text-left transition-all hover:bg-accent ${
                        selected ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${lens.color}`} />
                        <span className="text-sm font-medium">{lens.name}</span>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">{lens.shortDescription}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleReflect}
              disabled={!question.trim() || selectedLensIds.length === 0 || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              开始 Lens 折射
            </Button>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className="mx-auto max-w-3xl space-y-2 text-center">
              <p className="text-sm text-muted-foreground">原问题</p>
              <p className="rounded-lg bg-muted p-4 text-sm font-medium leading-6">{question}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {results.map((result) => {
                const lens = findLens(result.lensId);
                return (
                  <Card key={result.lensId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${lens?.color || "bg-primary"}`} />
                        <CardTitle className="text-base">{result.lensName}</CardTitle>
                        <span className="ml-auto text-xs text-muted-foreground">{result.latencyMs}ms</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="whitespace-pre-wrap text-sm leading-7">{result.content}</div>
                      <Button variant="outline" className="w-full" disabled>
                        深潜待接入
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mx-auto flex max-w-3xl gap-3">
              <Button variant="outline" onClick={reset} className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                调整视角
              </Button>
              <Button onClick={() => router.push("/")} className="flex-1">
                回到首页
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
