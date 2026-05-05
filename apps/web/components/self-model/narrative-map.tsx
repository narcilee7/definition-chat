"use client";

import { useMemo } from "react";

interface Entry {
  id: string;
  newNarrative: string;
  originalNarrative: string | null;
  lensName: string;
  createdAt: string;
}

interface NarrativeMapProps {
  entries: Entry[];
  onEntryClick?: (entryId: string) => void;
}

/**
 * 解释地图：用时间轴 + 节点的方式展示用户的叙事转变。
 * 简单但有效：不需要 D3，纯 CSS + SVG 即可。
 */
export function NarrativeMap({ entries, onEntryClick }: NarrativeMapProps) {
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [entries]);

  if (sortedEntries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
        <p>保存更多新解释后，这里会生长出你的解释地图。</p>
      </div>
    );
  }

  // 为每个 entry 分配一个垂直层级（模拟树状结构）
  const levels = useMemo(() => {
    const result: number[] = [];
    let currentLevel = 0;
    for (let i = 0; i < sortedEntries.length; i++) {
      result.push(currentLevel);
      currentLevel = (currentLevel + 1) % 3; // 3 层循环
    }
    return result;
  }, [sortedEntries]);

  const nodePositions = useMemo(() => {
    return sortedEntries.map((entry, i) => ({
      x: (i / Math.max(sortedEntries.length - 1, 1)) * 100,
      y: levels[i] * 35 + 15, // 百分比
      entry,
    }));
  }, [sortedEntries, levels]);

  return (
    <div className="relative w-full overflow-x-auto">
      <div className="min-w-[600px]">
        {/* SVG 连接线 */}
        <svg className="absolute inset-0 h-full w-full" style={{ minHeight: 200 }}>
          {/* 时间基线 */}
          <line
            x1="0%"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          {/* 节点间连线 */}
          {nodePositions.map((pos, i) => {
            if (i === 0) return null;
            const prev = nodePositions[i - 1];
            return (
              <line
                key={`line-${i}`}
                x1={`${prev.x}%`}
                y1={`${prev.y}%`}
                x2={`${pos.x}%`}
                y2={`${pos.y}%`}
                stroke="currentColor"
                strokeOpacity={0.15}
                strokeWidth={1.5}
              />
            );
          })}
        </svg>

        {/* 节点层 */}
        <div className="relative flex items-center justify-between" style={{ minHeight: 200 }}>
          {nodePositions.map((pos, i) => (
            <button
              key={pos.entry.id}
              onClick={() => onEntryClick?.(pos.entry.id)}
              className="group absolute flex flex-col items-center gap-1 transition-transform hover:scale-105"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* 节点圆点 */}
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20 transition-all group-hover:ring-primary/40" />
                {i === sortedEntries.length - 1 && (
                  <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </div>

              {/* 标签 */}
              <div className="max-w-[140px] text-center">
                <p className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                  {pos.entry.newNarrative}
                </p>
                <p className="mt-0.5 text-[9px] text-muted-foreground/60">
                  {pos.entry.lensName}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 时间轴标签 */}
      <div className="mt-2 flex justify-between px-4 text-[10px] text-muted-foreground/50">
        <span>最早</span>
        <span>最近</span>
      </div>
    </div>
  );
}
