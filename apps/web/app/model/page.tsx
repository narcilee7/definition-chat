"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { findLens } from "@/lib/lenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import {
  ArrowLeft,
  Beaker,
  Compass,
  Lightbulb,
  Loader2,
  NotebookText,
  Sparkles,
  Trash2,
} from "lucide-react";

interface SelfModelOverview {
  id: string;
  userId: string;
  topThemes: Array<{ theme: string; count: number }>;
  topLenses: Array<{ lensId: string; lensName: string; count: number }>;
  recurringPatterns: any[];
  stats: {
    totalEntries: number;
    totalExperiments: number;
    activeExperiments: number;
    completedExperiments: number;
  };
  recentEntries: Array<{
    id: string;
    entryType: string;
    originalNarrative: string | null;
    newNarrative: string;
    lensName: string;
    question: string;
    createdAt: string;
  }>;
  activeExperiments: Array<{
    id: string;
    description: string;
    sourceLensName: string | null;
    status: string;
    startedAt: string | null;
  }>;
}

interface Insight {
  type: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

const USER_ID = "default";

export default function SelfModelPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<SelfModelOverview | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [overviewData, insightsData] = await Promise.all([
        api.selfModel.get(USER_ID),
        api.selfModel.insights(USER_ID),
      ]);
      setOverview(overviewData);
      setInsights(insightsData);
    } catch (err) {
      console.error("Failed to load Self Model:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    setDeletingEntryId(entryId);
    try {
      await api.selfModel.deleteEntry(entryId);
      await loadData();
    } catch (err) {
      console.error("Failed to delete entry:", err);
    } finally {
      setDeletingEntryId(null);
    }
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
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            你正在形成哪些新的自我解释？
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Self Model 沉淀每次 Lens 深潜后的新解释。它不是临床档案，而是一张属于你的解释地图。
          </p>
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !overview || overview.stats.totalEntries === 0 ? (
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
            {/* 左侧边栏 */}
            <aside className="space-y-4">
              {/* 概览统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">概览</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted p-3">
                    <div className="text-2xl font-semibold">{overview.stats.totalEntries}</div>
                    <div className="text-xs text-muted-foreground">条新解释</div>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="text-2xl font-semibold">{overview.stats.totalExperiments}</div>
                    <div className="text-xs text-muted-foreground">个实验</div>
                  </div>
                </CardContent>
              </Card>

              {/* 高频 Lens */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Compass className="h-4 w-4" />
                    最常刺中你的 Lens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {overview.topLenses.map((item) => {
                    const lens = findLens(item.lensId);
                    return (
                      <div
                        key={item.lensId}
                        className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${lens?.color || "bg-primary"}`} />
                          {item.lensName}
                        </span>
                        <span className="text-muted-foreground">{item.count} 次</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* 反复出现的主题 */}
              {overview.topThemes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">反复出现的主题</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {overview.topThemes.map((item) => (
                      <span
                        key={item.theme}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                      >
                        {item.theme} · {item.count}
                      </span>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Insight Stream */}
              {insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="h-4 w-4" />
                      洞察
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {insights.map((insight, i) => (
                      <div key={i} className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium">{insight.title}</p>
                        <p className="mt-1 text-muted-foreground">{insight.description}</p>
                        {insight.action && (
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-1 h-auto p-0"
                            onClick={() => router.push(insight.action!.href)}
                          >
                            {insight.action.label} →
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </aside>

            {/* 主内容区 */}
            <section className="space-y-4">
              {/* 正在进行的实验 */}
              {overview.activeExperiments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Beaker className="h-4 w-4" />
                      正在进行的实验
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {overview.activeExperiments.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-start justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="text-sm">{exp.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            来自 {exp.sourceLensName || "Lens"}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                          {exp.status === "active" ? "进行中" : "待开始"}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 最近的新解释 */}
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">最近的新解释</h2>
                {overview.recentEntries.map((entry) => {
                  const lens = findLens(entry.lensName); // 这里用 name 找可能不准，先简单处理
                  return (
                    <Card key={entry.id}>
                      <CardHeader className="space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${lens?.color || "bg-primary"}`}
                              />
                              <span>{entry.lensName}</span>
                              <span>
                                {new Date(entry.createdAt).toLocaleString("zh-CN", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <CardTitle className="text-base leading-6">
                              {entry.newNarrative}
                            </CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEntry(entry.id)}
                            disabled={deletingEntryId === entry.id}
                            aria-label="删除解释"
                          >
                            {deletingEntryId === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      {entry.originalNarrative && (
                        <CardContent className="space-y-2 text-sm leading-6">
                          <div className="rounded-lg bg-muted p-3">
                            <div className="mb-1 text-xs text-muted-foreground">原问题</div>
                            {entry.originalNarrative}
                          </div>
                          <div className="rounded-lg border p-3">
                            <div className="mb-1 text-xs text-muted-foreground">新解释</div>
                            {entry.newNarrative}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
