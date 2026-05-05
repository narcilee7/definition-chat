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
│   ├── config/       # 共享 ESLint + TSConfig
│   ├── observability/# 共享日志、链路追踪抽象
│   └── agent-framework/# Agent 运行时框架
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
│   ├── base.ts           # Provider 基类（含调用日志 & 超时控制）
│   ├── siliconflow.ts    # 硅基流动 (国内, 低价)
│   ├── deepseek.ts       # DeepSeek (推理强)
│   ├── groq.ts           # Groq (超快)
│   ├── openrouter.ts     # OpenRouter (聚合)
│   └── openai-compatible.ts  # 通用兼容层
├── memory/
│   ├── buffer.ts         # 内存环形缓冲
│   ├── window.ts         # Token 感知滑动窗口
│   └── sqlite.ts         # SQLite 持久化
├── retry/
│   ├── retry.ts          # 指数退避重试
│   └── circuit-breaker.ts # 熔断器
└── orchestrator/
    ├── parallel.ts       # 并行执行
    ├── sequential.ts     # 串行传递
    └── debate.ts         # 双方辩论
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

设置 `DEFAULT_LLM_PROVIDER` 选择默认提供商：

```bash
DEFAULT_LLM_PROVIDER=deepseek   # 可选: siliconflow | deepseek | groq | openrouter | openai-compatible
```

### 自动容错降级

系统会自动按优先级尝试多个已配置 API Key 的 Provider：

1. **首选**：`DEFAULT_LLM_PROVIDER` 指定的 Provider
2. **降级**：其他已配置 API Key 的 Provider（依次尝试）

当首选 Provider 失败（如 401、超时、服务不可用）时，自动无缝切换到下一个可用 Provider，确保服务不中断。所有降级过程都会记录到日志中。

## 日志体系

基于 `nestjs-pino` + `@ohme/observability` 构建：

- **开发环境**：`pino-pretty` 美化输出，带颜色和时间戳
- **生产环境**：JSON 结构化输出，便于 ELK / Loki 采集
- **自动脱敏**：请求日志自动移除 `authorization` 和 `cookie` 头
- **全链路覆盖**：HTTP 请求、LLM 调用、业务操作、数据库连接均有日志

```bash
# 调整日志级别
LOG_LEVEL=debug   # debug | info | warn | error
```

关键日志场景：

| 场景 | 日志内容 |
|------|---------|
| HTTP 请求 | 方法、路径、状态码、耗时、IP |
| LLM 调用 | Provider、模型、耗时、Token、成功/失败 |
| 业务操作 | Session 创建、Agent 增删、消息收发 |
| 异常 | 堆栈、请求上下文、标准化错误响应 |

## 内置 Agent

- **理性之眼** — 冷静分析，帮你理清思路
- **温暖之翼** — 温柔接纳，疗愈情绪
- **锐锋之剑** — 锐利直接，戳破自欺
- **直觉之声** — 诗意感知，连接内心

## 创建自定义 Agent

访问 `/build`，与 OhMe Builder 对话式创建你的专属 Agent。
