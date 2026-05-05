"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { findLens } from "@/lib/lenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowLeft, CopyPlus, Library, Loader2, Search, Sparkles } from "lucide-react";

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface LensDetail {
  id: string;
  name: string;
  shortDescription: string;
  description?: string;
  domains: string[];
  sees: string[];
  ignores: string[];
  explainsPainAs?: string;
  coreQuestions?: string[];
  explorationMoves?: string[];
  risks?: string[];
  authorId?: string | null;
  authorName?: string | null;
  forkedFrom?: string | null;
  visibility: string;
  useCount: number;
  forkCount: number;
  createdAt: string;
}

export default function LensDetailPage() {
  const params = useParams<{ lensId: string }>();
  const router = useRouter();
  const [lens, setLens] = useState<LensDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [isForking, setIsForking] = useState(false);

  useEffect(() => {
    loadLens();
  }, [params.lensId]);

  const loadLens = async () => {
    setIsLoading(true);
    try {
      // 先尝试从后端加载
      const apiLens = await api.lenses.get(params.lensId);
      setLens(apiLens);
    } catch {
      // 后端找不到，回退到前端本地内置 Lens
      const localLens = findLens(params.lensId);
      if (localLens) {
        setLens({
          id: localLens.id,
          name: localLens.name,
          shortDescription: localLens.shortDescription,
          domains: localLens.domains,
          sees: localLens.sees,
          ignores: localLens.ignores || [],
          explainsPainAs: localLens.explainsPainAs,
          coreQuestions: localLens.coreQuestions,
          explorationMoves: localLens.explorationMoves,
          risks: localLens.risks,
          visibility: "public",
          useCount: 0,
          forkCount: 0,
          createdAt: "",
        });
      } else {
        setLens(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canUse = Boolean(question.trim() && lens);

  const reflectWithLens = () => {
    if (!canUse || !lens) return;
    const search = new URLSearchParams();
    search.set("question", question.trim());
    search.set("lenses", lens.id);
    router.push(`/reflect?${search.toString()}`);
  };

  const exploreWithLens = () => {
    if (!canUse || !lens) return;
    const search = new URLSearchParams();
    search.set("question", question.trim());
    search.set("lens", lens.id);
    router.push(`/explore?${search.toString()}`);
  };

  const forkLens = async () => {
    if (!lens) return;
    setIsForking(true);
    try {
      const forked = await api.lenses.fork(lens.id, "default");
      router.push(`/lenses/build?fork=${encodeURIComponent(JSON.stringify(forked))}`);
    } catch (err) {
      console.error("Failed to fork:", err);
      // 回退：用本地数据 Fork
      const localFork = {
        name: `${lens.name.replace(/\s*Lens$/, "")} Fork Lens`,
        shortDescription: lens.shortDescription,
        domains: lens.domains,
        sees: lens.sees,
        ignores: lens.ignores,
        explainsPainAs: lens.explainsPainAs || lens.shortDescription,
        coreQuestions: lens.coreQuestions || [],
        explorationMoves: lens.explorationMoves || [],
        risks: lens.risks || [],
      };
      router.push(`/lenses/build?fork=${encodeURIComponent(JSON.stringify(localFork))}`);
    } finally {
      setIsForking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lens) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/lenses")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ModeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-muted-foreground">没有找到这个 Lens。</p>
              <Button onClick={() => router.push("/lenses")}>回到 Lens 库</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isBuiltIn = !lens.authorId;
  const lensColor = isBuiltIn
    ? findLens(lens.id)?.color || "bg-primary"
    : "bg-fuchsia-500";
  const lensBg = isBuiltIn
    ? findLens(lens.id)?.bg || "bg-primary/10 text-primary"
    : "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/lenses")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">Lens 详情</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-5">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <Library className="h-3.5 w-3.5" />
              {isBuiltIn ? "内置 Lens" : lens.authorName || "社区 Lens"}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${lensColor}`} />
              <h1 className="text-3xl font-semibold tracking-tight">{lens.name}</h1>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{lens.shortDescription}</p>
            <div className="flex flex-wrap gap-2">
              {lens.domains.map((domain) => (
                <span key={domain} className={`rounded-full px-2 py-1 text-xs ${lensBg}`}>
                  {domain}
                </span>
              ))}
            </div>
            {!isBuiltIn && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>使用 {lens.useCount} 次</span>
                <span>Fork {lens.forkCount} 次</span>
                {lens.visibility === "public" && <span>公开</span>}
                {lens.visibility === "private" && <span>私有</span>}
                {lens.visibility === "unlisted" && <span>不公开</span>}
              </div>
            )}
          </div>

          <ListBlock title="它会看见" items={lens.sees} />
          <ListBlock title="它容易忽略" items={lens.ignores} />
          {lens.explainsPainAs && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">它如何解释痛苦</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">{lens.explainsPainAs}</CardContent>
            </Card>
          )}
          <ListBlock title="核心问题" items={lens.coreQuestions} />
          <ListBlock title="探索动作" items={lens.explorationMoves} />
          <ListBlock title="风险边界" items={lens.risks} />
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">试用这个 Lens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="输入一个想用这个 Lens 重新看的问题..."
                rows={5}
                className="resize-none"
              />
              <Button onClick={reflectWithLens} disabled={!canUse} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                单 Lens 折射
              </Button>
              <Button variant="outline" onClick={exploreWithLens} disabled={!canUse} className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                直接深潜
              </Button>
              <Button variant="outline" onClick={forkLens} disabled={isForking} className="w-full">
                {isForking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CopyPlus className="mr-2 h-4 w-4" />}
                Fork 成新 Lens
              </Button>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
