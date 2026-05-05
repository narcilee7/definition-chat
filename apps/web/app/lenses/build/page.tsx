"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ModeToggle } from "@/components/mode-toggle";
import { saveCustomLens } from "@/lib/lenses";
import { ArrowLeft, Check, Plus, Wand2 } from "lucide-react";

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function BuildLensPage() {
  const router = useRouter();
  const [name, setName] = useState("我的关系边界 Lens");
  const [shortDescription, setShortDescription] = useState("从边界、需求和责任分配的角度重新理解关系里的不舒服。");
  const [domains, setDomains] = useState("关系边界\n需求表达\n责任分配");
  const [sees, setSees] = useState("我把别人的情绪当成自己的责任\n我不敢直接表达需求\n我用退让换取关系稳定");
  const [ignores, setIgnores] = useState("现实资源限制\n对方真实的责任\n身体疲惫");
  const [explainsPainAs, setExplainsPainAs] = useState("痛苦可能来自边界模糊：你承担了不属于自己的责任，却没有给自己的需求留下位置。");
  const [coreQuestions, setCoreQuestions] = useState("这件事里哪些责任真的是我的？\n我没有说出口的需求是什么？\n如果我不靠退让维持关系，会发生什么？");
  const [explorationMoves, setExplorationMoves] = useState("把责任分成我的、对方的、环境的三栏。\n写下一句更清楚但不攻击人的需求表达。");
  const [risks, setRisks] = useState("可能把所有关系问题都解释成边界问题。\n可能忽略亲密关系里必要的互相照顾。");
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    const forkParam = new URLSearchParams(window.location.search).get("fork");
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
  }, []);

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

  const save = () => {
    if (!canSave) return;
    const lens = saveCustomLens({
      name: name.trim(),
      shortDescription: shortDescription.trim(),
      domains: preview.domains,
      sees: preview.sees,
      ignores: preview.ignores,
      explainsPainAs: explainsPainAs.trim(),
      coreQuestions: preview.coreQuestions,
      explorationMoves: preview.explorationMoves,
      risks: preview.risks,
    });
    setSavedId(lens.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
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
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">一句话描述</label>
                <Textarea value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">领域标签，每行一个</label>
                <Textarea value={domains} onChange={(event) => setDomains(event.target.value)} rows={3} />
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
                <Textarea value={sees} onChange={(event) => setSees(event.target.value)} rows={4} />
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
              <Button onClick={save} disabled={!canSave || Boolean(savedId)} className="w-full">
                {savedId ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {savedId ? "已保存" : "保存 Lens"}
              </Button>
              {savedId && (
                <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                  回到首页使用
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
