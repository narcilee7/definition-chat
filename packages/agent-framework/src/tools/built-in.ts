import { Tool } from './types';

/**
 * 内置工具集 — Agent 开箱即用的能力
 */

export const currentTimeTool: Tool = {
  name: 'current_time',
  description: '获取当前日期和时间',
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: '时区，如 Asia/Shanghai、UTC。不传则使用本地时区。',
      },
      format: {
        type: 'string',
        description: '格式：iso(ISO8601)、locale(本地格式)、date(仅日期)、time(仅时间)',
        enum: ['iso', 'locale', 'date', 'time'],
      },
    },
    required: [],
  },
  execute: (params) => {
    const now = new Date();
    const fmt = (params.format as string) || 'locale';
    switch (fmt) {
      case 'iso':
        return now.toISOString();
      case 'date':
        return now.toLocaleDateString('zh-CN');
      case 'time':
        return now.toLocaleTimeString('zh-CN');
      default:
        return now.toLocaleString('zh-CN');
    }
  },
};

export const calculatorTool: Tool = {
  name: 'calculator',
  description: '执行数学计算。支持基本运算如加减乘除、幂运算。表达式用 JavaScript 语法。',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: '数学表达式，如 "2 + 2 * 3"、"Math.sqrt(16)"、"100 / 7"',
      },
    },
    required: ['expression'],
  },
  execute: (params) => {
    const expr = String(params.expression || '');
    // Whitelist safe math operations only
    const safeExpr = expr.replace(/[^0-9+\-*/().\s^%MathsqrtpowabsroundfloorceilminmaxPIE]/gi, '');
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${safeExpr})`)();
      return String(result);
    } catch {
      return '计算错误：表达式无效';
    }
  },
};

export const searchMemoryTool: Tool = {
  name: 'search_memory',
  description: '搜索当前对话的记忆历史，查找用户之前提到的内容',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词',
      },
      limit: {
        type: 'number',
        description: '返回的最大条数，默认 5',
      },
    },
    required: ['query'],
  },
  // This tool needs access to memory, so it's a placeholder
  // Actual execution is handled by Agent.chat() with memory injection
  execute: () => '请在 Agent 配置中注入记忆实现',
};

export const webSearchTool: Tool = {
  name: 'web_search',
  description: '搜索互联网获取最新信息。注意：此工具需要外部搜索 API 配置。',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词',
      },
      num_results: {
        type: 'number',
        description: '返回结果数量，默认 3',
      },
    },
    required: ['query'],
  },
  execute: async (params) => {
    const query = String(params.query || '');
    const num = Number(params.num_results) || 3;

    // If SERPER_API_KEY or similar is configured, use it
    const apiKey = process.env.SERPER_API_KEY || process.env.SEARCH_API_KEY;
    if (!apiKey) {
      return `[搜索不可用] 未配置搜索 API Key。请设置 SERPER_API_KEY 环境变量。查询: "${query}"`;
    }

    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num }),
      });

      if (!res.ok) {
        return `[搜索失败] HTTP ${res.status}`;
      }

      const data = (await res.json()) as {
        organic?: Array<{ title: string; link: string; snippet: string }>;
      };

      const results = data.organic?.slice(0, num) || [];
      if (results.length === 0) {
        return `[无结果] 未找到关于 "${query}" 的搜索结果`;
      }

      return results
        .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.link}`)
        .join('\n\n');
    } catch (err) {
      return `[搜索错误] ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

export const builtInTools: Tool[] = [
  currentTimeTool,
  calculatorTool,
  searchMemoryTool,
  webSearchTool,
];
