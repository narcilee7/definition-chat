"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ModeToggle } from "@/components/mode-toggle";
import { encodeLensFork, findLens, LensOption } from "@/lib/lenses";
import { ArrowLeft, CopyPlus, Library, Search, Sparkles } from "lucide-react";

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

export default function LensDetailPage() {
  const params = useParams<{ lensId: string }>();
  const router = useRouter();
  const [lens, setLens] = useState<LensOption | undefined>();
  const [question, setQuestion] = useState("");

  useEffect(() => {
    setLens(findLens(params.lensId));
  }, [params.lensId]);

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

  const forkHref = useMemo(() => (lens ? `/lenses/build?fork=${encodeLensFork(lens)}` : "/lenses/build"), [lens]);

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
              {lens.isCustom ? "自定义 Lens" : "内置 Lens"}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${lens.color}`} />
              <h1 className="text-3xl font-semibold tracking-tight">{lens.name}</h1>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{lens.shortDescription}</p>
            <div className="flex flex-wrap gap-2">
              {lens.domains.map((domain) => (
                <span key={domain} className={`rounded-full px-2 py-1 text-xs ${lens.bg}`}>
                  {domain}
                </span>
              ))}
            </div>
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
              <Button variant="outline" onClick={() => router.push(forkHref)} className="w-full">
                <CopyPlus className="mr-2 h-4 w-4" />
                Fork 成新 Lens
              </Button>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
