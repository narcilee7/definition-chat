"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { LENS_OPTIONS } from "@/lib/lenses";
import { ArrowRight, Compass, Library, ScanLine, Sparkles, Wand2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [selectedLensIds, setSelectedLensIds] = useState<string[]>([
    "cognitive-judgment",
    "relationship-pattern",
    "shame",
  ]);

  const selectedCount = selectedLensIds.length;
  const canReflect = question.trim().length > 0 && selectedCount > 0;

  const selectedLabel = useMemo(() => {
    if (selectedCount === 0) return "选择至少一个视角";
    return `已选择 ${selectedCount} 个视角`;
  }, [selectedCount]);

  const toggleLens = (id: string) => {
    setSelectedLensIds((prev) =>
      prev.includes(id) ? prev.filter((lensId) => lensId !== id) : [...prev, id],
    );
  };

  const startReflection = () => {
    if (!canReflect) return;
    const params = new URLSearchParams();
    params.set("question", question.trim());
    params.set("lenses", selectedLensIds.join(","));
    router.push(`/reflect?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" />
            OhMe
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled>
              <Wand2 className="mr-1 h-4 w-4" />
              Build Lens 待接入
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <Compass className="h-3.5 w-3.5" />
              多视角解释与自我探索系统
            </div>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                从单一叙事里出来，换几个视角重新看见它。
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                输入一个正在困住你的问题，选择几个 Lens。OhMe 会分别解释它看见了什么、可能忽略什么，以及下一步可以如何探索。
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">你最近被什么问题困住了？</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="比如：我总觉得自己不配拥有稳定关系。"
                rows={6}
                className="resize-none text-base"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">{selectedLabel}</p>
                <Button onClick={startReflection} disabled={!canReflect} size="lg">
                  开始折射
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">选择你想借用的视角</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLensIds(LENS_OPTIONS.map((lens) => lens.id))}>
                全选
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {LENS_OPTIONS.map((lens) => {
                const selected = selectedLensIds.includes(lens.id);
                return (
                  <button
                    key={lens.id}
                    type="button"
                    onClick={() => toggleLens(lens.id)}
                    className={`rounded-lg border p-4 text-left transition-all hover:bg-accent ${
                      selected ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${lens.color}`} />
                      <span className="font-medium">{lens.name}</span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{lens.shortDescription}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {lens.domains.map((domain) => (
                        <span key={domain} className={`rounded-full px-2 py-0.5 text-[11px] ${lens.bg}`}>
                          {domain}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ScanLine className="h-4 w-4" />
                这不是咨询师
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Lens 是一套解释协议。它会明确说出自己看见什么，也会提醒自己可能忽略什么。</p>
              <p>目标不是替你下结论，而是帮你生成更准确的自我语言。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Library className="h-4 w-4" />
                折射会产出什么
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-md bg-muted p-3">这个 Lens 如何理解你的问题</div>
              <div className="rounded-md bg-muted p-3">它看见了什么，也可能忽略什么</div>
              <div className="rounded-md bg-muted p-3">一个关键问题和一个小探索动作</div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
