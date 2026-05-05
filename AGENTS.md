# OhMe — AI 结构化心理咨询平台

> 不是聊天机器人，是数字疗法。

OhMe 是一个 AI 驱动的心理咨询平台。用户可以选择或构建不同流派（CBT / DBT / ACT / 精神动力学）的 AI 咨询师，通过结构化治疗会话获得专业级心理支持。项目同时包含一个**多视角自我探索系统**（Lens / Refraction），允许用户借用不同解释框架重新理解自己的困境。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 (App Router) + React 18 + TypeScript |
| UI | shadcn/ui + Tailwind CSS + Radix UI + Lucide React |
| 后端 | NestJS 10 + Prisma ORM |
| 数据库 | PostgreSQL 14+ |
| LLM | DeepSeek / SiliconFlow / Groq / OpenRouter（自动降级） |
| 包管理 | pnpm + Turborepo |
| 测试 | Vitest（单元/集成）+ @testing-library/react + Playwright（E2E 依赖已装，但暂无用例） |
| 日志 | Pino（后端）+ 自研 Observability 包 |

---

## 项目结构（Turborepo Monorepo）

```
ohme/
├── apps/
│   ├── web/                 # Next.js 14 前端（端口 3000）
│   └── api/                 # NestJS 10 后端 API（端口 4000）
├── packages/
│   ├── agent-framework/     # Agent 运行时：多 Provider LLM、Memory、Tool、Orchestrator、Retry、State Machine、Vector Memory
│   ├── prompts/             # 五层 Prompt 系统（框架 → 流派 → 个案概念化 → 阶段 → 人格）
│   ├── types/               # 共享 TypeScript 类型定义
│   ├── config/              # 共享 ESLint + TSConfig 配置
│   └── observability/       # 共享日志、链路追踪抽象
├── prisma/
│   ├── schema.prisma        # 单一 Prisma Schema（PostgreSQL）
│   ├── migrations/          # Prisma Migrate 历史
│   └── seed.ts              # 种子数据：默认用户、4 个流派、4 个内置咨询师、安全计划、个案概念化
├── docs/
│   └── prodution/           # PRD 与设计文档（PRD_V1.md / PRD_V2.md / PRD_TRANSFORMATION_LENS.md / DESIGN/）
└── .github/workflows/ci.yml # GitHub Actions CI
```

### Workspace 依赖关系

- `@ohme/web` 依赖 `@ohme/types`
- `@ohme/api` 依赖 `@ohme/agent-framework`, `@ohme/observability`, `@ohme/prompts`, `@ohme/types`
- `@ohme/agent-framework` 依赖 `@ohme/observability`
- `@ohme/prompts` 无内部运行时依赖（纯 Prompt 文本）
- `@ohme/config` 被所有包和 app 作为 `devDependencies` 引用

---

## 环境配置

1. 复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 关键环境变量：
   - `DATABASE_URL` — PostgreSQL 连接串
   - `PORT` — API 端口（默认 4000）
   - `WEB_URL` — 前端地址（默认 http://localhost:3000）
   - `DEFAULT_LLM_PROVIDER` — 默认 LLM 提供商（`siliconflow` / `deepseek` / `groq` / `openrouter` / `openai-compatible`）
   - 各 Provider 的 `API_KEY` 和 `MODEL` 变量（至少配一个）

---

## 常用命令

所有命令均从项目根目录执行。

### 安装与初始化

```bash
# 安装所有依赖
pnpm install

# 生成 Prisma Client
pnpm db:generate

# 执行数据库迁移
pnpm db:migrate

# 填充种子数据
pnpm db:seed   # 等价于：pnpm exec prisma db seed
```

### 开发

```bash
# 同时启动所有 app（前端 + 后端）
pnpm dev

# 单独启动后端
pnpm --filter @ohme/api dev

# 单独启动前端
pnpm --filter @ohme/web dev
```

开发时前端通过 `next.config.mjs` 中的 `rewrites` 将 `/api/*` 代理到 `http://localhost:4000/api/*`。

### 构建

```bash
# 构建全部（Turborepo 会按依赖拓扑排序）
pnpm build

# 单独构建
pnpm --filter @ohme/api build
pnpm --filter @ohme/web build
```

Web 使用 `output: 'standalone'` 模式打包。

### 测试

```bash
# 运行所有测试
pnpm test

# 前端测试（Vitest + jsdom）
pnpm --filter @ohme/web test
pnpm --filter @ohme/web test:watch

# 后端测试（Vitest + node）
pnpm --filter @ohme/api test
pnpm --filter @ohme/api test:watch
```

测试文件命名：
- Web：`*.spec.ts`, `*.spec.tsx`, `*.test.ts`, `*.test.tsx`
- API：`src/**/*.spec.ts`, `src/**/*.test.ts`

### 代码检查与格式化

```bash
# 类型检查全部
pnpm typecheck

# Lint 全部
pnpm lint

# 格式化全部（Prettier）
pnpm format
```

---

## 代码风格指南

- **语言**：TypeScript，严格模式开启（`strict: true`）。
- **格式化**：Prettier，配置见 `.prettierrc`：
  - `semi: true`
  - `singleQuote: true`
  - `trailingComma: "all"`
  - `printWidth: 100`
  - `tabWidth: 2`
- **Lint**：ESLint，分层配置在 `packages/config/`：
  - `eslint-base.js` — 通用规则（prettier、@typescript-eslint）
  - `eslint-next.js` — 前端额外继承 `next/core-web-vitals`
  - `eslint-nest.js` — 后端额外关闭 Nest 常用宽松规则
- **未使用变量**：`@typescript-eslint/no-unused-vars` 设为 error，但允许 `_` 前缀的变量/参数被忽略。
- **any**：尽量避免。基础规则对 `any` 是 warn（Web）或 off（Nest，测试友好）。
- **注释与文档**：项目中大量注释和文档使用**中文**。新增功能时请保持中文注释习惯，尤其是面向业务领域（心理咨询流派、干预技术、风险评估）的说明。

---

## 数据库（Prisma + PostgreSQL）

- **单一 Schema 源**：`prisma/schema.prisma`，所有应用共用。
- **Prisma Client 生成**：在 `apps/api` 中执行 `pnpm db:generate`，会读取 `../../prisma/schema.prisma`。
- **迁移**：`pnpm db:migrate`（同样基于根目录的 schema）。
- **Studio**：`pnpm db:studio`
- **核心模型**：
  - `User` / `UserProfile` — 用户与档案
  - `TherapyApproach` — 治疗流派（CBT、DBT、ACT、精神动力学）
  - `TherapistPersona` — 咨询师人格（内置 + 用户自定义）
  - `TherapySession` / `SessionMessage` — 治疗会话与消息
  - `CaseFormulation` — 个案概念化（五因素模型、核心信念、治疗目标）
  - `Assessment` — 量表评估（PHQ-9、GAD-7 等）
  - `SafetyPlan` / `CrisisLog` — 安全计划与危机日志

---

## 后端架构（NestJS）

### 模块划分

| 模块 | 职责 |
|------|------|
| `TherapyModule` | 会话管理、阶段管理、Prompt 构建 |
| `ChatModule` | 治疗对话（普通 + SSE Stream） |
| `AgentsModule` | 咨询师人格 CRUD |
| `CaseFormulationModule` | 个案概念化 |
| `RiskModule` | 风险检测、危机干预 |
| `SafetyModule` | 安全计划 |
| `AssessmentModule` | 量表（PHQ-9 / GAD-7） |
| `RefractionModule` | 多 Lens 折射分析 |
| `ExploreModule` | 单 Lens 深度探索 |
| `BuilderModule` | 自定义咨询师 Builder |
| `InsightModule` | 洞察引擎 |
| `SessionsModule` | 基础会话管理 |
| `PrismaModule` | 数据库连接 |
| `LLMModule` / `LLMFallbackService` | LLM Provider 工厂 + 自动降级 |

### 关键设计

- **全局异常过滤**：`AllExceptionsFilter` + Pino Logger
- **Pino 替换 Nest 默认 Logger**：`nestjs-pino` + `LoggerErrorInterceptor`
- **CORS**：允许 `WEB_URL` 来源
- **ValidationPipe**：`whitelist: true, transform: true`
- **API 前缀**：所有路由带 `/api` 前缀

---

## 前端架构（Next.js 14 App Router）

### 目录约定

- `app/` — 页面路由（App Router）
- `components/` — React 组件（含 `components/ui/` 为 shadcn/ui 组件）
- `hooks/` — 自定义 React Hooks
- `lib/` — 工具函数、API 客户端、业务逻辑
- `test/setup.ts` — Vitest 初始化（引入 `@testing-library/jest-dom/vitest`）

### 关键页面

| 路由 | 功能 |
|------|------|
| `/` | 首页：多视角自我探索（Lens 选择与折射） |
| `/reflect` | 折射结果页 |
| `/lenses` | Lens 库 |
| `/lenses/build` | 自定义 Lens Builder |
| `/chat/new` | 新建治疗会话 |
| `/chat/[sessionId]` | 结构化治疗对话 |
| `/assess` | 量表评估 |
| `/progress` | 症状趋势 |
| `/safety` | 安全计划 |
| `/model` | Self Model |
| `/explore` | 探索页 |
| `/build` | 咨询师 Builder |

### API 客户端

`lib/api.ts` 封装了所有后端接口的 fetch 调用，按领域分组（`sessions`, `therapy`, `personas`, `assessments`, `safety`, `refraction`, `explore`, `builder`）。

### 前端代理

开发模式下，`next.config.mjs` 将 `/api/*` rewrite 到 `http://localhost:4000/api/*`，因此前端代码中调用 `/api/xxx` 即可。

---

## Agent Framework（`packages/agent-framework`）

这是一个自研的轻量级 Agent 运行时，核心能力：

- **多 Provider LLM**：SiliconFlow、DeepSeek、Groq、OpenRouter、OpenAI-Compatible，统一接口 + 自动降级
- **Memory**：BufferMemory、WindowMemory、SQLiteMemory、VectorMemoryStore（基于余弦相似度）
- **Tools**：ToolRegistry + ToolExecutor，内置工具（currentTime、calculator、searchMemory、webSearch）
- **Orchestrator**：并行执行、顺序执行、辩论模式
- **Retry**：指数退避重试 + 熔断器（CircuitBreaker）
- **State Machine**：AgentStateMachine + AgentLifecycle
- **Structured Output**：JSON Schema 约束生成
- **Streaming**：SSE 流解析

该包被后端 `@ohme/api` 直接依赖，用于驱动所有 LLM 交互。

---

## 五层 Prompt 系统（`packages/prompts`）

```
Layer 1: 基础治疗框架（所有流派共享）
    ↓
Layer 2: 流派特定协议（CBT / DBT / ACT / 精神动力学）
    ↓
Layer 3: 个案概念化注入（动态更新）
    ↓
Layer 4: 会话阶段指令（agenda_setting / mood_check / theme_work / summary）
    ↓
Layer 5: 人格微调（Persona 风格参数）
```

由 `PromptBuilderService` 在运行时逐层编译为最终 System Prompt。

---

## 测试策略

### 单元测试 / 集成测试（Vitest）

- **Web**：Vitest + `@vitejs/plugin-react` + `jsdom` + `@testing-library/react`。覆盖率 provider 为 `v8`。
- **API**：Vitest + `node` 环境。测试文件放在 `src/**/*.spec.ts` 或 `test/integration/*.spec.ts`。`test/setup.ts` 导入 `reflect-metadata` 以支持 NestJS 装饰器。
- **共享包**：目前未配置独立测试运行器，逻辑通常由引用方测试覆盖。

### E2E

- 已安装 `@playwright/test`，但 `apps/web/e2e/` 目录下**暂无测试用例**。

### CI（GitHub Actions）

`.github/workflows/ci.yml` 在 `push` 和 `pull_request` 到 `main` 时触发：

1. checkout
2. setup Node 20 + pnpm 9
3. `pnpm install --frozen-lockfile`
4. `pnpm --filter @ohme/types build`（必须先构建共享包）
5. `prisma generate`
6. `pnpm --filter @ohme/api typecheck && build`
7. `pnpm --filter @ohme/web typecheck && build`

> CI 中**不运行测试**，只执行构建和类型检查。

---

## 安全与合规

- **隐私**：`User` 模型包含 `consentGiven`、`consentAt`、`dataRetention` 字段，用于合规追踪。
- **风险评估**：每次对话实时风险检测，5 级分级（none → imminent）。检测到高危时触发危机干预话术。
- **安全计划**：标准 CBT 五步安全计划（warningSigns、 copingStrategies、distractions、supportPeople、professionals）。
- **免责声明**：OhMe 提供的是心理支持和结构化自助工具，**不是医疗诊断或治疗**。所有内置咨询师的 System Prompt 都包含 "不替代医学诊断" 的边界。
- **危机热线**：种子数据内置了中国大陆常用心理危机热线（希望 24 热线、北京心理危机干预中心）。

---

## 给 AI Agent 的额外提示

1. **不要修改 Seed 数据里的流派结构**（`prisma/seed.ts`）除非有明确的 PRD 变更。内置咨询师的 ID 格式为 `builtin-{name}`（如 `builtin-理性之眼`）。
2. **新增 API 端点**时，请在 `apps/api/src/app.module.ts` 中注册对应 Module，并遵循 NestJS 的 `Controller` + `Service` + `Module` 分层。
3. **新增前端页面**时，使用 App Router（`app/` 目录），组件放在 `components/`，共享逻辑放在 `lib/` 或 `hooks/`。
4. **修改 Prisma Schema**后，必须运行 `pnpm db:generate` 和 `pnpm db:migrate`，并检查 `prisma/seed.ts` 是否需要同步更新。
5. **共享包变更**后，需要先构建（`pnpm --filter @ohme/types build` 等），下游应用才能识别新类型。Turborepo 的 `build` task 已配置 `dependsOn: ["^build"]`，根目录 `pnpm build` 会自动处理拓扑。
6. **中文优先**：业务注释、Prompt 文本、用户可见文案均以中文为主。技术实现注释可用英文，但涉及心理咨询领域概念时请用中文以便团队成员理解。
