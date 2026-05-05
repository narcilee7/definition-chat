"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { deleteCustomLens, getAllLensOptions, LensOption } from "@/lib/lenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowLeft, CopyPlus, Eye, Library, Loader2, Search, Trash2, Wand2 } from "lucide-react";

interface LensFromApi {
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



export default function LensLibraryPage() {
  const router = useRouter();
  const [builtinLenses, setBuiltinLenses] = useState<LensOption[]>([]);
  const [apiLenses, setApiLenses] = useState<LensFromApi[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "builtin" | "community" | "mine">("all");

  useEffect(() => {
    setBuiltinLenses(getAllLensOptions());
    loadApiLenses();
  }, []);

  const loadApiLenses = async () => {
    setIsLoading(true);
    try {
      const result = await api.lenses.list({ visibility: "public", sortBy: "popular", limit: 50 });
      setApiLenses(result.lenses || []);
    } catch (err) {
      console.error("Failed to load lenses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustom = (id: string) => {
    deleteCustomLens(id);
    setBuiltinLenses(getAllLensOptions());
  };

  const handleFork = async (lensId: string) => {
    try {
      await api.lenses.fork(lensId, "default");
      // 刷新列表
      loadApiLenses();
    } catch (err) {
      console.error("Failed to fork:", err);
    }
  };

  const filteredBuiltin = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return builtinLenses;
    return builtinLenses.filter((lens) =>
      [lens.name, lens.shortDescription, ...lens.domains, ...lens.sees].join(" ").toLowerCase().includes(normalized),
    );
  }, [builtinLenses, query]);

  const filteredApi = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return apiLenses;
    return apiLenses.filter((lens) =>
      [lens.name, lens.shortDescription, lens.description || "", ...lens.domains, ...lens.sees].join(" ").toLowerCase().includes(normalized),
    );
  }, [apiLenses, query]);

  const displayBuiltin = activeTab === "all" || activeTab === "builtin" ? filteredBuiltin : [];
  const displayApi = activeTab === "all" || activeTab === "community" || activeTab === "mine" ? filteredApi : [];

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
            解释框架市场
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">发现、试用、创造解释视角。</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Lens 库汇集了内置视角和社区创建的解释框架。你可以试用任何一个 Lens，也可以 Fork 并改造它。
          </p>
        </section>

        {/* 筛选标签 */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "全部" },
            { key: "builtin", label: "内置" },
            { key: "community", label: "社区" },
            { key: "mine", label: "我的" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "border bg-background hover:bg-accent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 搜索 */}
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 Lens、领域或它看见的信号"
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* 内置 Lens */}
            {displayBuiltin.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground">内置 Lens</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {displayBuiltin.map((lens) => (
                    <LensCard
                      key={lens.id}
                      name={lens.name}
                      shortDescription={lens.shortDescription}
                      domains={lens.domains}
                      sees={lens.sees}
                      color={lens.color}
                      bg={lens.bg}
                      isCustom={lens.isCustom}
                      onDelete={lens.isCustom ? () => handleDeleteCustom(lens.id) : undefined}
                      onFork={() => router.push(`/lenses/build?fork=${encodeURIComponent(JSON.stringify(lens))}`)}
                      onView={() => router.push(`/lenses/${lens.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* API Lens（社区/自定义） */}
            {displayApi.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {activeTab === "mine" ? "我的 Lens" : "社区 Lens"}
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {displayApi.map((lens) => (
                    <LensCard
                      key={lens.id}
                      name={lens.name}
                      shortDescription={lens.shortDescription}
                      domains={lens.domains}
                      sees={lens.sees}
                      color="bg-fuchsia-500"
                      bg="bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300"
                      isCustom={true}
                      useCount={lens.useCount}
                      forkCount={lens.forkCount}
                      authorName={lens.authorName}
                      onDelete={undefined}
                      onFork={() => handleFork(lens.id)}
                      onView={() => router.push(`/lenses/${lens.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {displayBuiltin.length === 0 && displayApi.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">没有找到匹配的 Lens</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function LensCard({
  name,
  shortDescription,
  domains,
  sees,
  color,
  bg,
  isCustom,
  useCount,
  forkCount,
  authorName,
  onDelete,
  onFork,
  onView,
}: {
  name: string;
  shortDescription: string;
  domains: string[];
  sees: string[];
  color: string;
  bg: string;
  isCustom?: boolean;
  useCount?: number;
  forkCount?: number;
  authorName?: string | null;
  onDelete?: () => void;
  onFork: () => void;
  onView: () => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              <CardTitle className="text-base">{name}</CardTitle>
              {isCustom && (
                <span className="rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[10px] text-fuchsia-700 dark:text-fuchsia-300">
                  {authorName || "自定义"}
                </span>
              )}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{shortDescription}</p>
          </div>
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete} aria-label="删除 Lens">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4">
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <span key={domain} className={`rounded-full px-2 py-1 text-xs ${bg}`}>
              {domain}
            </span>
          ))}
        </div>
        <div className="space-y-1 text-sm">
          <div className="text-xs text-muted-foreground">它会看见</div>
          <div className="line-clamp-2 text-muted-foreground">{sees.join(" / ")}</div>
        </div>
        {(useCount !== undefined || forkCount !== undefined) && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            {useCount !== undefined && <span>使用 {useCount} 次</span>}
            {forkCount !== undefined && <span>Fork {forkCount} 次</span>}
          </div>
        )}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onView}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            详情
          </Button>
          <Button variant="outline" onClick={onFork}>
            <CopyPlus className="mr-1 h-3.5 w-3.5" />
            Fork
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
