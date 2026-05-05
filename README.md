# OhMe — V5 AI 心理咨询平台

> 不是聊天机器人，是有临床结构和安全边界的数字心理干预。

OhMe V5 回归治疗内核：用户打开产品后直接说出困扰，AI 在后台完成风险扫描、治疗阶段管理、个案概念化、干预选择、会话小结、练习沉淀和疗效追踪。用户看到的是自然对话，不是流程表单或 Lens 工具。

---

## 当前 V5 体验

- `/`：直接聊天入口，快速开始焦虑、低落、关系、失眠、工作压力等主题。
- `/chat/[sessionId]`：极简治疗对话空间。支持 SSE 流式回复、风险提醒、帮助感评分、结束本次并生成小结。
- `/progress`：治疗档案，展示当前治疗重点、核心洞察、练习记录、情绪追踪、PHQ-9/GAD-7 趋势、会话摘要和已使用技术。
- `/assess`：PHQ-9 / GAD-7 量表评估，支持 `/assess?type=PHQ-9` 和 `/assess?type=GAD-7` 直接进入指定量表。
- `/safety`：安全计划与危机资源。
- `/settings`：服务边界、隐私说明、数据导出、危机热线。

V4 的 `/reflect`、`/explore`、`/lenses`、`/lenses/build` 已在 Next config 中重定向；相关后端模块暂时保留，后续清理。

---

## V5 核心能力

### 治疗对话引擎

- 一层 V5 整合取向 System Prompt，替代旧版显性五层拼装体验。
- 后台阶段：`engagement -> assessment -> intervention -> closure`。
- 用户不可见阶段标签，只感受到自然对话推进。
- 多流派技术作为治疗师工具自然调用：CBT、DBT、ACT、身体觉察、动力学/依恋视角。

### 会话后治疗资产

对话达到足够信息量或用户点击“结束本次并生成小结”后，后端会自动生成：

- `sessionSummary`：会话摘要。
- `insights`：核心洞察。
- `homework`：轻量练习。
- `postMood.extracted`：后台提取的心情、焦虑、压力、睡眠、食欲线索。
- `CaseFormulation`：个案概念化版本更新。

用户也可以手动提交：

- 帮助感评分：`allianceRating`，1-5 分。
- 情绪 check-in：`postMood.selfReport`，心情/焦虑/压力 0-10 分。
- 练习完成状态：`homework[].completed`。

### 风险与安全

- 用户每次输入先做关键词快速风险扫描。
- 必要时调用 LLM 风险评估。
- 风险等级：`none / low / moderate / high / imminent`。
- 高危或紧急情况会触发危机干预话术并记录 `CrisisLog`。
- 内置中国大陆常用危机热线与 CBT 五步安全计划。

### 疗效追踪

- PHQ-9 / GAD-7 量表。
- 治疗档案展示量表趋势。
- 会话帮助感评分。
- 情绪 check-in 趋势。
- 练习完成记录。

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
│   ├── agent-framework/     # 多 Provider LLM、Memory、Tool、Retry、Streaming
│   ├── prompts/             # V5 治疗师 Prompt + 旧版流派 Prompt
│   ├── types/               # 共享类型
│   ├── config/              # ESLint / TSConfig
│   └── observability/       # 日志与链路追踪抽象
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── docs/prodution/PRD/
    ├── PRD_V5.md
    ├── PRD_V4.md
    ├── PRD_TRANSFORMATION_LENS.md
    ├── PRD_V2.md
    └── PRD_V1.md
```

---

## 本地运行

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

关键变量：

- `DATABASE_URL`
- `PORT`，默认 4000
- `WEB_URL`，默认 `http://localhost:3000`
- `DEFAULT_LLM_PROVIDER`
- 至少一个 Provider API Key，如 `DEEPSEEK_API_KEY`、`SILICONFLOW_API_KEY`、`GROQ_API_KEY`、`OPENROUTER_API_KEY`

### 3. 数据库初始化

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

如果拉到包含 `session_summary` 的 V5 迁移后，务必执行：

```bash
pnpm db:migrate
```

### 4. 启动开发服务

```bash
pnpm --filter @ohme/api dev
pnpm --filter @ohme/web dev
```

打开 `http://localhost:3000`。

前端开发环境通过 Next rewrites 将 `/api/*` 代理到 `http://localhost:4000/api/*`。

---

## 常用命令

```bash
# 全部开发
pnpm dev

# 类型检查
pnpm typecheck
pnpm --filter @ohme/api typecheck
pnpm --filter @ohme/web typecheck

# 测试
pnpm test
pnpm --filter @ohme/api test
pnpm --filter @ohme/web test

# 构建
pnpm build
pnpm --filter @ohme/api build
pnpm --filter @ohme/web build

# Prisma
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

---

## 关键 API

### Therapy Chat

- `POST /api/therapy/sessions`：创建治疗会话。
- `GET /api/therapy/sessions/:id`：读取会话状态与消息。
- `POST /api/therapy/chat`：非流式治疗对话。
- `POST /api/therapy/chat/stream`：SSE 流式治疗对话。
- `POST /api/therapy/sessions/:id/complete`：结束本次会话并强制生成小结/洞察/练习/概念化。
- `POST /api/therapy/sessions/:id/phase`：后台阶段设置，主要用于调试。

### Session Record

- `GET /api/sessions?userId=default`：会话列表。
- `POST /api/sessions/:id/feedback`：提交 1-5 分帮助感评分。
- `POST /api/sessions/:id/mood`：提交 0-10 分情绪 check-in。
- `PATCH /api/sessions/:id/homework/:index`：更新练习完成状态。

### Treatment Record

- `GET /api/case-formulations/:userId/latest`：最新个案概念化。
- `GET /api/assessments/trend?type=PHQ-9&userId=default`：量表趋势。
- `POST /api/assessments`：提交 PHQ-9 / GAD-7。

---

## 数据模型重点

- `TherapySession.phase`：V5 后台阶段，`engagement / assessment / intervention / closure`。
- `TherapySession.sessionSummary` / `summaryGeneratedAt`：会话摘要。
- `TherapySession.insights`：核心洞察。
- `TherapySession.homework`：练习记录。
- `TherapySession.skillsIntroduced`：干预技术统计。
- `TherapySession.allianceRating`：用户主观帮助感。
- `TherapySession.postMood`：情绪追踪，包含 `extracted` 和 `selfReport`。
- `SessionMessage.interventionType` / `techniqueUsed`：后台技术标注，不在前台显式展示。
- `CaseFormulation`：动态个案概念化版本。
- `Assessment`：PHQ-9 / GAD-7。
- `SafetyPlan` / `CrisisLog`：安全计划与危机记录。

---

## Prompt 系统

V5 主路径在 `packages/prompts/src/v5/`：

- `therapist.ts`：整合取向治疗师核心 Prompt、阶段感知、个案概念化注入、人格风格注入。
- `compiler.ts`：V5 System Prompt 编译与压缩。

旧版 CBT / DBT / ACT / 精神动力学协议仍保留，用于种子数据和后续可能的技术库迁移，但当前用户体验不再要求用户选择流派。

---

## 安全声明

OhMe 提供心理支持和结构化自助工具，不提供医疗诊断、处方或紧急救援。

如果你有自杀或自伤风险，请立即联系：

- 全国希望 24 热线：`400-161-9995`
- 北京心理危机干预中心：`010-82951332`
- 紧急情况请拨打 `120` 或 `110`

---

## 当前剩余方向

- 接入真实用户、同意记录、删除流程和数据保留策略。
- 完善危机升级：紧急联系人、真人转介、地区化资源。
- 清理 V4 Lens / Refraction / Exploration 独立模块。
- 增加 E2E 用例覆盖首页开聊、流式对话、结束会话、治疗档案、量表、安全计划。
- 做疗效验证：随访提醒、长期趋势、A/B 测试。
