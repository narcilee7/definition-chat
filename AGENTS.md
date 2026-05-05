# OhMe — V5 AI 结构化心理咨询平台

> 给 AI Agent 的项目说明。当前方向以 PRD V5 为准：真正的 AI 心理咨询，不是 Lens 玩具，不是自由陪聊。

OhMe V5 是一个 AI 驱动的结构化心理咨询平台。用户不再选择 Lens 或显式治疗阶段，而是直接说出困扰；系统在后台完成风险评估、治疗阶段推进、个案概念化、干预技术选择、会话小结、练习沉淀和疗效追踪。

---

## 当前产品原则

1. **直接聊**：首页只有一个主要输入框，快速开始真实困扰。
2. **治疗结构后台化**：阶段存在于系统里，不作为 clinical UI 暴露给用户。
3. **第一次对话要有价值**：AI 回复优先让用户感到被理解，再自然进入澄清和干预。
4. **多流派是治疗师工具**：CBT / DBT / ACT / 精神动力学能力由 AI 自然调用，不让用户选择 Lens。
5. **每次会话都沉淀资产**：摘要、洞察、作业、情绪线索、个案概念化、疗效指标。
6. **安全边界优先**：不诊断、不替代真人治疗、不回避危机风险。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 App Router + React 18 + TypeScript |
| UI | shadcn/ui + Tailwind CSS + Radix UI + Lucide React |
| 后端 | NestJS 10 + Prisma ORM |
| 数据库 | PostgreSQL 14+ |
| LLM | DeepSeek / SiliconFlow / Groq / OpenRouter / OpenAI-Compatible（自动降级） |
| 包管理 | pnpm + Turborepo |
| 测试 | Vitest + @testing-library/react |
| 日志 | Pino + `@ohme/observability` |

---

## 项目结构

```text
ohme/
├── apps/
│   ├── web/                 # Next.js 前端，端口 3000
│   └── api/                 # NestJS API，端口 4000
├── packages/
│   ├── agent-framework/     # LLM Provider、Memory、Tool、Retry、Streaming
│   ├── prompts/             # V5 Prompt + 旧版流派 Prompt
│   ├── types/               # 共享类型
│   ├── config/              # ESLint / TSConfig
│   └── observability/       # 日志、链路追踪抽象
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── docs/prodution/PRD/
    ├── PRD_V5.md            # 当前方向
    ├── PRD_V4.md            # Lens 旧方向
    ├── PRD_TRANSFORMATION_LENS.md
    ├── PRD_V2.md
    └── PRD_V1.md
```

### Workspace 依赖关系

- `@ohme/web` 依赖 `@ohme/types`
- `@ohme/api` 依赖 `@ohme/agent-framework`, `@ohme/observability`, `@ohme/prompts`, `@ohme/types`
- `@ohme/agent-framework` 依赖 `@ohme/observability`
- `@ohme/prompts` 为纯 Prompt / 编译器包
- `@ohme/config` 被各 app/package 作为 devDependency 使用

---

## 常用命令

所有命令默认从项目根目录执行。

```bash
pnpm install

pnpm db:generate
pnpm db:migrate
pnpm db:seed

pnpm --filter @ohme/api dev
pnpm --filter @ohme/web dev

pnpm --filter @ohme/api typecheck
pnpm --filter @ohme/web typecheck

pnpm --filter @ohme/api test -- --run
pnpm --filter @ohme/web test -- --run

pnpm --filter @ohme/api build
pnpm --filter @ohme/web build
```

开发时前端通过 Next rewrites 将 `/api/*` 代理到 `http://localhost:4000/api/*`。

修改 Prisma schema 后必须执行：

```bash
pnpm db:generate
pnpm db:migrate
```

当前 V5 已新增 `session_summary` / `summary_generated_at` 迁移，拉取后需要跑 `pnpm db:migrate`。

---

## 环境变量

- `DATABASE_URL`：PostgreSQL 连接串。
- `PORT`：API 端口，默认 4000。
- `WEB_URL`：前端地址，默认 `http://localhost:3000`。
- `DEFAULT_LLM_PROVIDER`：`siliconflow` / `deepseek` / `groq` / `openrouter` / `openai-compatible`。
- 至少配置一个 Provider API Key，如 `DEEPSEEK_API_KEY`、`SILICONFLOW_API_KEY`、`GROQ_API_KEY`、`OPENROUTER_API_KEY`。

---

## V5 前端信息架构

| 路由 | 状态 | 功能 |
|------|------|------|
| `/` | V5 主入口 | 直接输入困扰并创建治疗会话 |
| `/chat/[sessionId]` | V5 核心 | 流式治疗对话、帮助感评分、结束本次并生成小结 |
| `/progress` | V5 核心 | 治疗档案、情绪追踪、量表趋势、洞察、练习、摘要 |
| `/assess` | V5 核心 | PHQ-9 / GAD-7，支持 `?type=PHQ-9` |
| `/safety` | V5 核心 | 安全计划与危机资源 |
| `/settings` | V5 核心 | 服务边界、隐私说明、数据导出、危机热线 |
| `/reflect` | 废弃 | 重定向到首页 |
| `/explore` | 废弃 | 重定向到首页 |
| `/lenses` | 废弃 | 重定向到首页 |
| `/lenses/build` | 废弃 | 重定向到首页 |
| `/model` | 废弃 | 重定向到 `/progress` |
| `/build` | 旧功能 | 咨询师 Builder，暂保留 |
| `/chat/new` | 旧功能 | 新建治疗会话旧入口，主路径不依赖 |

新增页面请使用 App Router，放在 `apps/web/app/`；可复用组件放 `apps/web/components/`；业务客户端封装放 `apps/web/lib/api.ts`。

---

## 后端模块

| 模块 | 职责 |
|------|------|
| `ChatModule` | V5 治疗对话、SSE、会话完成、治疗资产生成 |
| `TherapyModule` | 后台会话状态、Prompt 构建 |
| `CaseFormulationModule` | 个案概念化版本管理 |
| `RiskModule` | 风险检测、危机干预 |
| `SafetyModule` | 安全计划 |
| `AssessmentModule` | PHQ-9 / GAD-7 |
| `SessionsModule` | 会话列表、反馈、情绪 check-in、练习完成 |
| `AgentsModule` | 咨询师人格 CRUD |
| `BuilderModule` | 自定义咨询师 Builder |
| `InsightModule` | 旧洞察引擎，部分测试保留 |
| `RefractionModule` / `ExploreModule` / `LensModule` / `SelfModelModule` | V4 遗留，暂保留但不作为 V5 主路径 |
| `PrismaModule` | 数据库连接 |
| `LLMModule` / `LLMFallbackService` | 多 Provider LLM 自动降级 |

新增 API 端点时遵循 NestJS `Controller + Service + Module` 分层；如新增模块，需要在 `apps/api/src/app.module.ts` 注册。

---

## 关键 V5 API

### Therapy Chat

- `POST /api/therapy/sessions`：创建治疗会话。
- `GET /api/therapy/sessions/:id`：读取会话状态与消息。
- `POST /api/therapy/chat`：非流式治疗对话。
- `POST /api/therapy/chat/stream`：SSE 流式治疗对话。
- `POST /api/therapy/sessions/:id/complete`：结束本次会话并强制生成小结/洞察/练习/概念化。
- `POST /api/therapy/sessions/:id/phase`：后台阶段设置，主要用于调试。

### Session Record

- `GET /api/sessions?userId=default`：会话列表。
- `POST /api/sessions/:id/feedback`：提交帮助感评分。
- `POST /api/sessions/:id/mood`：提交 0-10 分情绪 check-in。
- `PATCH /api/sessions/:id/homework/:index`：更新练习完成状态。

### Treatment Record

- `GET /api/case-formulations/:userId/latest`：最新个案概念化。
- `POST /api/assessments`：提交 PHQ-9 / GAD-7。
- `GET /api/assessments/trend?type=PHQ-9&userId=default`：量表趋势。
- `GET /api/safety-plans/:userId` / `POST /api/safety-plans/:userId`：安全计划。

---

## 数据库重点

- `TherapySession.phase`：V5 后台阶段，`engagement / assessment / intervention / closure`。
- `TherapySession.presentingProblem`：用户首次输入的主诉。
- `TherapySession.sessionSummary` / `summaryGeneratedAt`：会话小结。
- `TherapySession.insights`：核心洞察。
- `TherapySession.homework`：轻量练习，含 `completed` / `completedAt` / `reflection`。
- `TherapySession.skillsIntroduced`：后台统计使用过的技术。
- `TherapySession.allianceRating`：用户主观帮助感，1-5 分。
- `TherapySession.postMood`：情绪追踪 JSON，约定包含：
  - `extracted`：AI 后台提取的心情、焦虑、压力、睡眠、食欲线索。
  - `selfReport`：用户手动 check-in。
- `SessionMessage.interventionType` / `techniqueUsed`：后台干预标注，前台不显式展示技术标签。
- `CaseFormulation`：动态个案概念化版本。
- `Assessment`：PHQ-9 / GAD-7。
- `SafetyPlan` / `CrisisLog`：安全计划与危机记录。

不要随意改 `prisma/seed.ts` 的内置流派和咨询师结构，除非 PRD 明确要求。内置咨询师 ID 格式为 `builtin-{name}`。

---

## Prompt 系统

V5 主路径在 `packages/prompts/src/v5/`：

- `therapist.ts`：整合取向治疗师核心 Prompt、后台阶段感知、个案概念化注入、人格风格注入。
- `compiler.ts`：V5 System Prompt 编译与压缩。

V5 Prompt 是“一层整合治疗师 Prompt + 动态注入块”，不要把用户体验退回旧 V2 的显性五层阶段 UI。

旧版 CBT / DBT / ACT / 精神动力学协议仍保留，主要用于种子数据和后续技术库迁移。

---

## 代码风格

- TypeScript 严格模式。
- Prettier：
  - `semi: true`
  - `singleQuote: true`
  - `trailingComma: "all"`
  - `printWidth: 100`
  - `tabWidth: 2`
- 未使用变量是 error，但 `_` 前缀变量/参数允许忽略。
- 新增业务文案、Prompt、领域注释优先中文。
- 前端 UI 用 shadcn/ui + Tailwind + Lucide React；按钮优先用图标表达明确动作。
- 不要在前台暴露“当前阶段：评估/干预”等 clinical UI。
- 不要在 AI 回复下方显示技术标签；技术只用于后台统计。

---

## 测试策略

- Web：Vitest + jsdom + Testing Library。
- API：Vitest + node。
- Playwright 已安装但目前无 E2E 用例。
- CI 当前只运行类型检查和构建，不运行测试。

推荐在完成 V5 相关改动后至少执行：

```bash
pnpm --filter @ohme/api typecheck
pnpm --filter @ohme/api test -- --run
pnpm --filter @ohme/api build
pnpm --filter @ohme/web typecheck
pnpm --filter @ohme/web test -- --run
pnpm --filter @ohme/web build
```

---

## 安全与合规

- OhMe 提供心理支持和结构化自助，不提供医疗诊断、处方或紧急救援。
- 危机风险高时，优先触发危机干预话术和热线资源。
- `User` 模型已有 `consentGiven`、`consentAt`、`dataRetention` 字段，但真实用户同意流程尚未接入。
- `/settings` 提供服务边界、隐私说明和 JSON 数据导出。
- 上线前必须补齐真实账号、同意记录、删除流程、数据保留策略、地区化危机资源。

危机资源：

- 全国希望 24 热线：`400-161-9995`
- 北京心理危机干预中心：`010-82951332`
- 紧急情况：`120` / `110`

---

## 给 AI Agent 的额外提示

1. 当前产品方向以 `docs/prodution/PRD/PRD_V5.md` 为准。
2. 不要重新强化 V4 Lens / Refraction / Exploration 主路径；这些是遗留模块。
3. 新增前端页面时使用 App Router，组件放 `components/`，客户端 API 放 `lib/api.ts`。
4. 修改 Prisma Schema 后必须运行 `pnpm db:generate` 和 `pnpm db:migrate`，并检查 seed 是否需要同步。
5. 共享包变更后先构建上游包或运行根构建，避免下游类型未更新。
6. 治疗领域文本、Prompt、用户可见文案优先中文。
7. 对心理健康安全相关改动保持保守：不诊断、不承诺疗效、不弱化危机提示。
8. 工作区可能已有用户未提交改动，修改前先查看 `git status`，不要覆盖无关变更。
