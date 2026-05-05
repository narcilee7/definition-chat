"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { findLens } from "@/lib/lenses";
import { NarrativeMap } from "@/components/self-model/narrative-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ModeToggle } from "@/components/mode-toggle";
import {
  ArrowLeft,
  Beaker,
  Check,
  Compass,
  Lightbulb,
  Loader2,
  NotebookText,
  Pencil,
  Sparkles,
  Trash2,
  X,
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
    userEdited?: boolean;
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
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [updatingExperimentId, setUpdatingExperimentId] = useState<string | null>(null);

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

  const startEdit = (entry: { id: string; newNarrative: string }) => {
    setEditingEntryId(entry.id);
    setEditText(entry.newNarrative);
  };

  const cancelEdit = () => {
    setEditingEntryId(null);
    setEditText("");
  };

  const saveEdit = async (entryId: string) => {
    if (!editText.trim()) return;
    try {
      await api.selfModel.updateEntry(entryId, {
        newNarrative: editText.trim(),
        userEdited: true,
      });
      setEditingEntryId(null);
      await loadData();
    } catch (err) {
      console.error("Failed to update entry:", err);
    }
  };

  const updateExperiment = async (experimentId: string, status: string) => {
    setUpdatingExperimentId(experimentId);
    try {
      await api.selfModel.updateExperiment(experimentId, { status });
      await loadData();
    } catch (err) {
      console.error("Failed to update experiment:", err);
    } finally {
      setUpdatingExperimentId(null);
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

              {/* 解释地图 */}
              {overview.recentEntries.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">解释地图</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <NarrativeMap
                      entries={overview.recentEntries.slice(0, 8)}
                      onEntryClick={(id) => {
                        const el = document.getElementById(`entry-${id}`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    />
                  </CardContent>
                </Card>
              )}

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
                        className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="flex-1">
                          <p className="text-sm">{exp.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            来自 {exp.sourceLensName || "Lens"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {exp.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateExperiment(exp.id, "active")}
                              disabled={updatingExperimentId === exp.id}
                            >
                              {updatingExperimentId === exp.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "开始"
                              )}
                            </Button>
                          )}
                          {exp.status === "active" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateExperiment(exp.id, "completed")}
                                disabled={updatingExperimentId === exp.id}
                              >
                                <Check className="mr-1 h-3.5 w-3.5" />
                                完成
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateExperiment(exp.id, "dropped")}
                                disabled={updatingExperimentId === exp.id}
                              >
                                <X className="mr-1 h-3.5 w-3.5" />
                                放弃
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 最近的新解释 */}
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">最近的新解释</h2>
                {overview.recentEntries.map((entry) => {
                  const lens = findLens(entry.lensName);
                  const isEditing = editingEntryId === entry.id;

                  return (
                    <Card key={entry.id} id={`entry-${entry.id}`}>
                      <CardHeader className="space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2 flex-1">
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
                              {entry.userEdited && (
                                <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-700">
                                  已编辑
                                </span>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={3}
                                  className="resize-none"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveEdit(entry.id)}>
                                    保存
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                    取消
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <CardTitle className="text-base leading-6">
                                {entry.newNarrative}
                              </CardTitle>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEdit(entry)}
                                aria-label="编辑"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
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
                          )}
                        </div>
                      </CardHeader>
                      {entry.originalNarrative && (
                        <CardContent className="space-y-2 text-sm leading-6">
                          <div className="rounded-lg bg-muted p-3">
                            <div className="mb-1 text-xs text-muted-foreground">原问题</div>
                            {entry.originalNarrative}
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
