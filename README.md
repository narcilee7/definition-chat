# OhMe — 你的内在人格工坊

构建不同人格的 AI Agent，与它们对话，探索自我、疗愈内心、解决问题。

## 架构

```
ohme/
├── apps/
│   ├── web/          # Next.js 14 + shadcn/ui + 暗模式
│   └── api/          # Nest.js 10 + Prisma + Agent Framework
├── packages/
│   ├── types/        # 共享 TypeScript 类型
│   └── config/       # 共享 ESLint + TSConfig
├── prisma/           # SQLite 数据库 Schema
└── .github/
    └── workflows/    # CI/CD
```

## Agent Framework

```
agent-framework/
├── core/
│   ├── agent.ts          # Agent 实例 (persona + memory + provider)
│   ├── registry.ts       # Agent 注册表
│   └── types.ts          # 核心类型定义
├── providers/
│   ├── siliconflow.provider.ts   # 硅基流动 (国内, 主推)
│   ├── deepseek.provider.ts      # DeepSeek
│   ├── groq.provider.ts          # Groq (超快)
│   ├── openrouter.provider.ts    # OpenRouter
│   └── openai-compatible.provider.ts  # 通用兼容层
├── memory/
│   ├── buffer.memory.ts   # 内存环形缓冲
│   ├── window.memory.ts   # Token 感知滑动窗口
│   └── sqlite.memory.ts   # SQLite 持久化
└── orchestrator/
    ├── parallel.ts        # 并行执行
    ├── sequential.ts      # 串行传递
    └── debate.ts          # 双方辩论
```

## 本地运行

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 LLM Provider API Key

# 初始化数据库
pnpm exec prisma generate --schema=prisma/schema.prisma

# 启动后端
pnpm --filter @ohme/api dev      # http://localhost:4000

# 启动前端（新终端）
pnpm --filter @ohme/web dev      # http://localhost:3000
```

## LLM Provider 配置

支持以下云服务商（均无需本地部署）：

| Provider | 环境变量 | 特点 |
|----------|---------|------|
| **SiliconFlow** | `SILICONFLOW_API_KEY` | 国内直连，超便宜，多模型 |
| **DeepSeek** | `DEEPSEEK_API_KEY` | 推理能力强，价格便宜 |
| **Groq** | `GROQ_API_KEY` | 超快推理速度 |
| **OpenRouter** | `OPENROUTER_API_KEY` | 聚合平台，fallback |
| **Generic** | `OPENAI_COMPAT_*` | 任意兼容服务商 |

设置 `DEFAULT_LLM_PROVIDER=siliconflow` 选择默认提供商。

## 内置 Agent

- **理性之眼** — 冷静分析，帮你理清思路
- **温暖之翼** — 温柔接纳，疗愈情绪
- **锐锋之剑** — 锐利直接，戳破自欺
- **直觉之声** — 诗意感知，连接内心

## 创建自定义 Agent

访问 `/build`，与 OhMe Builder 对话式创建你的专属 Agent。
