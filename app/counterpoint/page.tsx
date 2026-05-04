'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CounterpointContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const question = searchParams.get('question') || '';
  const s1 = searchParams.get('s1') || '';
  const s2 = searchParams.get('s2') || '';

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9] px-6">
      <div className="text-center space-y-4 max-w-lg">
        <h1 className="text-2xl font-semibold text-[#1C1917]">对位模式</h1>
        <p className="text-[#78716C]">
          让两个立场就同一问题展开辩论。
        </p>
        <p className="text-sm text-[#d6d3d1]">
          此功能将在 v0.2 中推出。
        </p>
        {question && (
          <blockquote className="text-[#1C1917] text-sm leading-relaxed pl-4 border-l-4 border-[#d6d3d1] text-left mt-4">
            {question}
          </blockquote>
        )}
        {(s1 || s2) && (
          <p className="text-xs text-[#78716C]">
            {s1 && `立场A: ${s1}`} {s2 && `· 立场B: ${s2}`}
          </p>
        )}
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-2.5 bg-[#1C1917] text-white text-sm font-medium rounded-full hover:bg-[#44403C] transition-colors"
        >
          返回投问
        </button>
      </div>
    </main>
  );
}

export default function CounterpointPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <p className="text-[#78716C]">加载中...</p>
        </main>
      }
    >
      <CounterpointContent />
    </Suspense>
  );
}
