"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowLeft, Check, Loader2, Plus, Wand2 } from "lucide-react";

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function BuildLensPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [savedLens, setSavedLens] = useState<any | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [domains, setDomains] = useState("");
  const [sees, setSees] = useState("");
  const [ignores, setIgnores] = useState("");
  const [explainsPainAs, setExplainsPainAs] = useState("");
  const [coreQuestions, setCoreQuestions] = useState("");
  const [explorationMoves, setExplorationMoves] = useState("");
  const [risks, setRisks] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("private");

  // Fork from URL param
  useEffect(() => {
    const forkParam = searchParams.get("fork");
    if (!forkParam) return;

    try {
      const lens = JSON.parse(decodeURIComponent(forkParam));
      setName(lens.name || "");
      setShortDescription(lens.shortDescription || "");
      setDomains(Array.isArray(lens.domains) ? lens.domains.join("\n") : "");
      setSees(Array.isArray(lens.sees) ? lens.sees.join("\n") : "");
      setIgnores(Array.isArray(lens.ignores) ? lens.ignores.join("\n") : "");
      setExplainsPainAs(lens.explainsPainAs || "");
      setCoreQuestions(Array.isArray(lens.coreQuestions) ? lens.coreQuestions.join("\n") : "");
      setExplorationMoves(Array.isArray(lens.explorationMoves) ? lens.explorationMoves.join("\n") : "");
      setRisks(Array.isArray(lens.risks) ? lens.risks.join("\n") : "");
    } catch {
      // Ignore invalid fork payloads.
    }
  }, [searchParams]);

  const canSave = name.trim() && shortDescription.trim() && splitLines(sees).length > 0 && explainsPainAs.trim();

  const preview = useMemo(() => {
    return {
      domains: splitLines(domains),
      sees: splitLines(sees),
      ignores: splitLines(ignores),
      coreQuestions: splitLines(coreQuestions),
      explorationMoves: splitLines(explorationMoves),
      risks: splitLines(risks),
    };
  }, [coreQuestions, domains, explorationMoves, ignores, risks, sees]);

  const save = async () => {
    if (!canSave) return;
    setIsLoading(true);
    try {
      const lens = await api.lenses.create({
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        domains: preview.domains,
        sees: preview.sees,
        ignores: preview.ignores,
        explainsPainAs: explainsPainAs.trim(),
        coreQuestions: preview.coreQuestions,
        explorationMoves: preview.explorationMoves,
        risks: preview.risks,
        authorId: "default",
        visibility,
      });
      setSavedLens(lens);
    } catch (err) {
      console.error("Failed to save lens:", err);
      alert("保存失败，请检查网络连接。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/lenses")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">Build Lens</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <Wand2 className="h-3.5 w-3.5" />
              创建一个可调用的解释框架
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">把一种看问题的方式保存成 Lens。</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              这里创建的不是人格，而是一套解释协议：它看见什么、忽略什么、如何解释痛苦、如何推动探索。
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">基础信息</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lens 名称</label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="比如：关系边界 Lens" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">一句话描述</label>
                <Textarea value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} rows={2} placeholder="用一句话说明这个 Lens 的核心视角" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">领域标签，每行一个</label>
                <Textarea value={domains} onChange={(event) => setDomains(event.target.value)} rows={3} placeholder="关系边界&#10;需求表达&#10;责任分配" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">解释协议</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">它会看见什么，每行一个</label>
                <Textarea value={sees} onChange={(event) => setSees(event.target.value)} rows={4} placeholder="自动判断&#10;证据不足&#10;灾难化" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">它容易忽略什么，每行一个</label>
                <Textarea value={ignores} onChange={(event) => setIgnores(event.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">它如何解释痛苦</label>
                <Textarea value={explainsPainAs} onChange={(event) => setExplainsPainAs(event.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">核心问题，每行一个</label>
                <Textarea value={coreQuestions} onChange={(event) => setCoreQuestions(event.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">探索动作，每行一个</label>
                <Textarea value={explorationMoves} onChange={(event) => setExplorationMoves(event.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">风险边界，每行一个</label>
                <Textarea value={risks} onChange={(event) => setRisks(event.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">发布选项</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {[
                  { key: "private", label: "私有", desc: "仅自己使用" },
                  { key: "unlisted", label: "不公开", desc: "有链接就能访问" },
                  { key: "public", label: "公开", desc: "进入 Lens Market" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setVisibility(opt.key as any)}
                    className={`flex-1 rounded-lg border p-3 text-left transition-all ${
                      visibility === opt.key ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">预览</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" />
                  <span className="font-medium">{name || "未命名 Lens"}</span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{shortDescription}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {preview.domains.map((domain) => (
                  <span key={domain} className="rounded-full bg-fuchsia-500/10 px-2 py-1 text-xs text-fuchsia-700 dark:text-fuchsia-300">
                    {domain}
                  </span>
                ))}
              </div>
              <div className="space-y-2 text-sm">
                <div className="font-medium">会看见</div>
                <ul className="space-y-1 text-muted-foreground">
                  {preview.sees.slice(0, 4).map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <Button onClick={save} disabled={!canSave || Boolean(savedLens) || isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : savedLens ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {isLoading ? "保存中..." : savedLens ? "已保存" : "保存 Lens"}
              </Button>
              {savedLens && (
                <div className="space-y-2">
                  <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                    回到首页使用
                  </Button>
                  <Button variant="ghost" onClick={() => router.push(`/lenses/${savedLens.id}`)} className="w-full">
                    查看 Lens 详情
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}

export default function BuildLensPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BuildLensPageInner />
    </Suspense>
  );
}
