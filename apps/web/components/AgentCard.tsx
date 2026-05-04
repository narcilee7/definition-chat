'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    role: string;
    tone: string;
    color: string;
    description: string;
    isBuiltIn: boolean;
  };
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <div
      className="group bg-white rounded-2xl border border-[#e7e5e4] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: agent.color }} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-[#1C1917]">{agent.name}</h3>
            <span className="text-xs text-[#78716C]">
              {agent.isBuiltIn ? '内置' : '自定义'} · {agent.role}
            </span>
          </div>
          <span
            className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
            style={{ backgroundColor: agent.color }}
          />
        </div>
        <p className="text-sm text-[#78716C] leading-relaxed mb-5">{agent.description}</p>
        <Link
          href={`/chat/new?agentId=${agent.id}`}
          className={cn(
            'block w-full text-center py-2.5 text-sm font-medium rounded-xl border border-[#e7e5e4] text-[#78716C] transition-all duration-200',
            'hover:text-white hover:border-transparent'
          )}
          style={{ ['--hover-bg' as string]: agent.color }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = agent.color;
            (e.target as HTMLElement).style.borderColor = agent.color;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = '';
            (e.target as HTMLElement).style.borderColor = '';
          }}
        >
          开始对话
        </Link>
      </div>
    </div>
  );
}
