'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BUILTIN_STANCES } from '@/lib/definition';
import { STANCE_COLORS } from '@/types';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [selectedStances, setSelectedStances] = useState<string[]>(
    BUILTIN_STANCES.map((s) => s.id)
  );
  const [questionError, setQuestionError] = useState(false);
  const [stanceError, setStanceError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleStance = (id: string) => {
    setSelectedStances((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setStanceError(false);
  };

  const handleSubmit = () => {
    let hasError = false;

    if (!question.trim()) {
      setQuestionError(true);
      hasError = true;
      setTimeout(() => setQuestionError(false), 500);
    }

    if (selectedStances.length === 0) {
      setStanceError(true);
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);
    const params = new URLSearchParams();
    params.set('question', question.trim());
    params.set('stances', selectedStances.join(','));
    router.push(`/refraction?${params.toString()}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[#FAFAF9]">
      <div className="w-full max-w-2xl flex flex-col items-center gap-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-sm tracking-[0.3em] uppercase text-[#78716C]">
            Definition
          </h1>
          <p className="text-[#1C1917] text-lg">
            投一个问题，看不同立场如何折射它
          </p>
        </div>

        {/* Textarea */}
        <div className="w-full">
          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setQuestionError(false);
            }}
            placeholder="此刻困扰你的是什么？"
            rows={4}
            className={cn(
              'w-full resize-none rounded-xl border-2 bg-white p-6 text-lg leading-relaxed text-[#1C1917] placeholder:text-[#d6d3d1] focus:outline-none transition-all duration-200',
              questionError
                ? 'border-red-400 animate-shake'
                : 'border-[#e7e5e4] focus:border-[#a8a29e]'
            )}
          />
        </div>

        {/* Stance Selection */}
        <div className="w-full">
          <div className="flex flex-wrap justify-center gap-3">
            {BUILTIN_STANCES.map((stance) => {
              const isSelected = selectedStances.includes(stance.id);
              const color = STANCE_COLORS[stance.id] || '#78716C';
              return (
                <button
                  key={stance.id}
                  onClick={() => toggleStance(stance.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-200 select-none',
                    isSelected
                      ? 'bg-white shadow-sm'
                      : 'bg-transparent border-[#e7e5e4] text-[#78716C] hover:border-[#d6d3d1]'
                  )}
                  style={
                    isSelected
                      ? { borderColor: color, color: color }
                      : undefined
                  }
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium">{stance.name}</span>
                </button>
              );
            })}
          </div>
          {stanceError && (
            <p className="text-center text-red-500 text-sm mt-3">
              至少选择一个立场
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-12 py-4 bg-[#1C1917] text-white text-lg font-medium rounded-full hover:bg-[#44403C] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '折射中...' : '折射'}
        </button>
      </div>
    </main>
  );
}
