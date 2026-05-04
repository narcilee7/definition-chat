'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BUILTIN_STANCES, getStanceById } from '@/lib/definition';
import { STANCE_COLORS, STANCE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface ResultItem {
  stanceId: string;
  stanceName: string;
  content: string;
  loading: boolean;
  error?: string;
}

function RefractionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const question = searchParams.get('question') || '';
  const stanceIdsParam = searchParams.get('stances') || '';
  const stanceIds = stanceIdsParam.split(',').filter(Boolean);

  const [results, setResults] = useState<ResultItem[]>([]);
  const [counterpointFirst, setCounterpointFirst] = useState<string | null>(null);

  const fetchRefraction = useCallback(async () => {
    if (!question || stanceIds.length === 0) return;

    const initialResults: ResultItem[] = stanceIds.map((id) => {
      const stance = getStanceById(id);
      return {
        stanceId: id,
        stanceName: stance?.name || id,
        content: '',
        loading: true,
      };
    });
    setResults(initialResults);

    // Parallel requests
    const promises = stanceIds.map(async (id, index) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stanceId: id,
            message: question,
            history: [],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '这位思想家此刻沉默');
        }

        const data = await res.json();
        return { index, content: data.content, error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : '这位思想家此刻沉默';
        return { index, content: '', error: msg };
      }
    });

    // Update results as they come in
    promises.forEach((promise) => {
      promise.then(({ index, content, error }) => {
        setResults((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            content,
            error: error || undefined,
            loading: false,
          };
          return next;
        });
      });
    });
  }, [question, stanceIds]);

  useEffect(() => {
    fetchRefraction();
  }, [fetchRefraction]);

  const handleDive = (stanceId: string) => {
    const params = new URLSearchParams();
    params.set('question', question);
    router.push(`/dive/${stanceId}?${params.toString()}`);
  };

  const handleCounterpoint = (stanceId: string) => {
    if (!counterpointFirst) {
      setCounterpointFirst(stanceId);
    } else if (counterpointFirst === stanceId) {
      setCounterpointFirst(null);
    } else {
      const params = new URLSearchParams();
      params.set('question', question);
      params.set('s1', counterpointFirst);
      params.set('s2', stanceId);
      router.push(`/counterpoint?${params.toString()}`);
    }
  };

  if (!question) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <p className="text-[#78716C]">没有问题，请先投问。</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      {/* Header with question */}
      <div className="sticky top-0 z-10 bg-[#FAFAF9]/90 backdrop-blur-sm border-b border-[#e7e5e4]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-[#78716C] hover:text-[#1C1917] mb-3 transition-colors"
          >
            ← 返回投问
          </button>
          <blockquote className="text-[#1C1917] text-lg leading-relaxed pl-4 border-l-4 border-[#d6d3d1]">
            {question}
          </blockquote>
        </div>
      </div>

      {/* Counterpoint hint */}
      {counterpointFirst && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="bg-[#1C1917] text-white text-sm px-4 py-2 rounded-full inline-flex items-center gap-2">
            <span>已选择「{STANCE_LABELS[counterpointFirst] || counterpointFirst}」，再选一个立场开始对位</span>
            <button
              onClick={() => setCounterpointFirst(null)}
              className="text-[#a8a29e] hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6 md:overflow-x-auto md:pb-4">
          {results.map((result) => {
            const color = STANCE_COLORS[result.stanceId] || '#78716C';
            return (
              <div
                key={result.stanceId}
                className={cn(
                  'flex-shrink-0 w-full md:w-[320px] bg-white rounded-xl border border-[#e7e5e4] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                  counterpointFirst === result.stanceId && 'ring-2 ring-offset-2'
                )}
                style={counterpointFirst === result.stanceId ? { ringColor: color } : undefined}
              >
                {/* Color band */}
                <div className="h-1 w-full" style={{ backgroundColor: color }} />

                <div className="p-6">
                  {/* Stance header */}
                  <div className="mb-4">
                    <h3 className="text-[#1C1917] font-semibold text-base">
                      {result.stanceName}
                    </h3>
                    <span className="text-xs text-[#78716C]">
                      {getStanceById(result.stanceId)?.era}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="min-h-[120px] mb-6">
                    {result.loading ? (
                      <div className="space-y-3">
                        <div className="h-4 bg-[#f5f5f4] rounded animate-shimmer w-full" />
                        <div className="h-4 bg-[#f5f5f4] rounded animate-shimmer w-5/6" />
                        <div className="h-4 bg-[#f5f5f4] rounded animate-shimmer w-4/6" />
                      </div>
                    ) : result.error ? (
                      <p className="text-[#78716C] text-sm italic">{result.error}</p>
                    ) : (
                      <p className="text-[#1C1917] text-base leading-relaxed whitespace-pre-wrap">
                        {result.content}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {!result.loading && !result.error && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDive(result.stanceId)}
                        className="flex-1 py-2 text-sm font-medium rounded-lg border border-[#e7e5e4] text-[#78716C] hover:text-white hover:border-transparent transition-all duration-200"
                        style={{
                          ['--hover-bg' as string]: color,
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.backgroundColor = color;
                          (e.target as HTMLElement).style.borderColor = color;
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.backgroundColor = '';
                          (e.target as HTMLElement).style.borderColor = '';
                        }}
                      >
                        深聊
                      </button>
                      <button
                        onClick={() => handleCounterpoint(result.stanceId)}
                        className={cn(
                          'flex-1 py-2 text-sm font-medium rounded-lg border transition-all duration-200',
                          counterpointFirst === result.stanceId
                            ? 'text-white'
                            : 'border-[#e7e5e4] text-[#78716C] hover:text-white'
                        )}
                        style={
                          counterpointFirst === result.stanceId
                            ? { backgroundColor: color, borderColor: color }
                            : { ['--hover-bg' as string]: color }
                        }
                        onMouseEnter={(e) => {
                          if (counterpointFirst !== result.stanceId) {
                            (e.target as HTMLElement).style.backgroundColor = color;
                            (e.target as HTMLElement).style.borderColor = color;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (counterpointFirst !== result.stanceId) {
                            (e.target as HTMLElement).style.backgroundColor = '';
                            (e.target as HTMLElement).style.borderColor = '';
                          }
                        }}
                      >
                        {counterpointFirst === result.stanceId ? '已选择' : '加入对位'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function RefractionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <p className="text-[#78716C]">加载中...</p>
        </main>
      }
    >
      <RefractionContent />
    </Suspense>
  );
}
