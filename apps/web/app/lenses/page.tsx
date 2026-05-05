"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import { deleteCustomLens, getAllLensOptions, LensOption } from "@/lib/lenses";
import { ArrowLeft, CopyPlus, Library, Search, Trash2, Wand2 } from "lucide-react";

export default function LensLibraryPage() {
  const router = useRouter();
  const [lenses, setLenses] = useState<LensOption[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLenses(getAllLensOptions());
  }, []);

  const filteredLenses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return lenses;

    return lenses.filter((lens) =>
      [lens.name, lens.shortDescription, ...lens.domains, ...lens.sees].join(" ").toLowerCase().includes(normalized),
    );
  }, [lenses, query]);

  const removeLens = (id: string) => {
    deleteCustomLens(id);
    setLenses(getAllLensOptions());
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">Lens 库</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => router.push("/lenses/build")}>
              <Wand2 className="mr-1 h-4 w-4" />
              Build Lens
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <Library className="h-3.5 w-3.5" />
            内置视角与自定义 Lens
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">选择、查看、Fork 一个解释框架。</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Lens 库让解释框架成为可管理的对象。内置 Lens 可以 Fork，自定义 Lens 可以继续使用或删除。
          </p>
        </section>

        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 Lens、领域或它看见的信号" className="pl-9" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredLenses.map((lens) => (
            <Card key={lens.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${lens.color}`} />
                      <CardTitle className="text-base">{lens.name}</CardTitle>
                      {lens.isCustom && (
                        <span className="rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[10px] text-fuchsia-700 dark:text-fuchsia-300">
                          自定义
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{lens.shortDescription}</p>
                  </div>
                  {lens.isCustom && (
                    <Button variant="ghost" size="icon" onClick={() => removeLens(lens.id)} aria-label="删除 Lens">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {lens.domains.map((domain) => (
                    <span key={domain} className={`rounded-full px-2 py-1 text-xs ${lens.bg}`}>
                      {domain}
                    </span>
                  ))}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-xs text-muted-foreground">它会看见</div>
                  <div className="line-clamp-2 text-muted-foreground">{lens.sees.join(" / ")}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => router.push(`/lenses/${lens.id}`)}>
                    查看详情
                  </Button>
                  <Button variant="outline" onClick={() => router.push(`/lenses/build?fork=${encodeURIComponent(JSON.stringify(lens))}`)}>
                    <CopyPlus className="mr-1 h-4 w-4" />
                    Fork
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
