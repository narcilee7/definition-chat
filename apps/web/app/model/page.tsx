"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { deleteSelfModelEntry, readSelfModelEntries, SelfModelEntry } from "@/lib/self-model";
import { findLens } from "@/lib/lenses";
import { ArrowLeft, Compass, NotebookText, Sparkles, Trash2 } from "lucide-react";

function getTopLens(entries: SelfModelEntry[]) {
  const counts = new Map<string, { name: string; count: number }>();
  for (const entry of entries) {
    const current = counts.get(entry.lensId) || { name: entry.lensName, count: 0 };
    counts.set(entry.lensId, { ...current, count: current.count + 1 });
  }
  return Array.from(counts.entries())
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => b.count - a.count);
}

function getRecurringWords(entries: SelfModelEntry[]) {
  const text = entries.map((entry) => `${entry.question} ${entry.newInterpretation}`).join(" ");
  const candidates = ["关系", "工作", "羞耻", "不配", "焦虑", "意义", "身体", "价值", "失败", "稳定", "被看见"];
  return candidates
    .map((word) => ({ word, count: (text.match(new RegExp(word, "g")) || []).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export default function SelfModelPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<SelfModelEntry[]>([]);

  useEffect(() => {
    setEntries(readSelfModelEntries());
  }, []);

  const topLens = useMemo(() => getTopLens(entries), [entries]);
  const recurringWords = useMemo(() => getRecurringWords(entries), [entries]);

  const deleteEntry = (id: string) => {
    deleteSelfModelEntry(id);
    setEntries(readSelfModelEntries());
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">Self Model</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <NotebookText className="h-3.5 w-3.5" />
            自我解释地图
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">你正在形成哪些新的自我解释？</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Self Model 会沉淀每次 Lens 深潜后的新解释。它不是临床档案，而是一张属于你的解释地图。
          </p>
        </section>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
              <div className="space-y-2">
                <h2 className="text-lg font-medium">还没有保存的新解释</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  从首页发起一次 Lens 折射，进入深潜后保存结果，这里就会开始长出你的 Self Model。
                </p>
              </div>
              <Button onClick={() => router.push("/")}>开始一次折射</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">概览</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted p-3">
                    <div className="text-2xl font-semibold">{entries.length}</div>
                    <div className="text-xs text-muted-foreground">条新解释</div>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="text-2xl font-semibold">{topLens.length}</div>
                    <div className="text-xs text-muted-foreground">个 Lens</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Compass className="h-4 w-4" />
                    高频 Lens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topLens.map((item) => {
                    const lens = findLens(item.id);
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
                        <span className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${lens?.color || "bg-primary"}`} />
                          {item.name}
                        </span>
                        <span className="text-muted-foreground">{item.count}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">反复出现的词</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {recurringWords.map((item) => (
                    <span key={item.word} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                      {item.word} · {item.count}
                    </span>
                  ))}
                </CardContent>
              </Card>
            </aside>

            <section className="space-y-4">
              {entries.map((entry) => {
                const lens = findLens(entry.lensId);
                return (
                  <Card key={entry.id}>
                    <CardHeader className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className={`h-2.5 w-2.5 rounded-full ${lens?.color || "bg-primary"}`} />
                            <span>{entry.lensName}</span>
                            <span>{new Date(entry.createdAt).toLocaleString("zh-CN")}</span>
                          </div>
                          <CardTitle className="text-base leading-6">{entry.newInterpretation}</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} aria-label="删除解释">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-6">
                      <div className="rounded-lg bg-muted p-3">
                        <div className="mb-1 text-xs text-muted-foreground">原问题</div>
                        {entry.question}
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="mb-1 text-xs text-muted-foreground">你的修正</div>
                        {entry.userResponse}
                      </div>
                      <details className="rounded-lg border p-3">
                        <summary className="cursor-pointer text-xs text-muted-foreground">查看完整探索收束</summary>
                        <div className="mt-3 whitespace-pre-wrap">{entry.exploration}</div>
                      </details>
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
