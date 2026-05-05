"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";

const APPROACH_OPTIONS = [
  { id: "cbt", name: "认知行为疗法", color: "bg-blue-500" },
  { id: "dbt", name: "辩证行为疗法", color: "bg-violet-500" },
  { id: "act", name: "接纳承诺疗法", color: "bg-emerald-500" },
  { id: "psychodynamic", name: "精神动力学", color: "bg-gray-500" },
];

export default function ReflectPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [selectedApproaches, setSelectedApproaches] = useState<string[]>(["cbt", "act"]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const toggleApproach = (id: string) => {
    setSelectedApproaches((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleReflect = async () => {
    if (!question.trim() || selectedApproaches.length === 0 || isLoading) return;

    setIsLoading(true);
    try {
      // For now, simulate refraction with individual chat calls
      // In production, this should call a dedicated refraction API
      const simulatedResults = selectedApproaches.map((approachId) => ({
        approachId,
        approachName: APPROACH_OPTIONS.find((a) => a.id === approachId)?.name || approachId,
        content: `【${APPROACH_OPTIONS.find((a) => a.id === approachId)?.name}视角】\n\n这是一个模拟的流派分析结果。在实际实现中，这里会并行调用多个 AI 咨询师，各自从所属流派的角度分析你的问题。\n\n从${APPROACH_OPTIONS.find((a) => a.id === approachId)?.name}的角度看，你的问题"${question.slice(0, 30)}..."值得关注的点是...`,
      }));

      // Small delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setResults(simulatedResults);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-3xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">流派折射</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">多流派视角分析</h1>
          <p className="text-muted-foreground text-sm">
            把你的问题同时投向多个流派，看看不同角度如何理解它
          </p>
        </div>

        {!results && (
          <div className="space-y-6">
            {/* Question Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">你的问题或困扰</label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="描述你当前面临的问题..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Approach Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">选择要折射的流派</label>
              <div className="grid grid-cols-2 gap-3">
                {APPROACH_OPTIONS.map((approach) => (
                  <button
                    key={approach.id}
                    onClick={() => toggleApproach(approach.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedApproaches.includes(approach.id)
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${approach.color}`} />
                      <span className="text-sm font-medium">{approach.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleReflect}
              disabled={!question.trim() || selectedApproaches.length === 0 || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              开始折射分析
            </Button>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">原问题</p>
              <p className="text-sm font-medium bg-muted rounded-lg p-3">{question}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {results.map((result) => (
                <Card key={result.approachId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          APPROACH_OPTIONS.find((a) => a.id === result.approachId)?.color || "bg-primary"
                        }`}
                      />
                      <CardTitle className="text-base">{result.approachName}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{result.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setResults(null)} className="flex-1">
                再试一次
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
