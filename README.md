# OhMe — 结构化 AI 心理咨询平台

> 不是聊天机器人，是数字疗法。

OhMe 是一个 AI 驱动的心理咨询平台。用户可以选择或构建不同流派的 AI 咨询师，通过**结构化治疗会话**获得专业级心理支持。每一次对话都基于动态更新的**个案概念化**，每一轮干预都忠于所选流派的**技术体系**。

---

## 核心特性

### 🧠 结构化治疗会话
- 不是自由聊天，是有临床结构的会话
- 四阶段流程：议程设置 → 情绪检查 → 主题工作 → 总结收束
- AI 回复标注使用的干预技术（如「苏格拉底提问」「认知重构」）

### 🎯 多流派支持
- **CBT**（认知行为疗法）— 识别认知扭曲、行为实验
- **DBT**（辩证行为疗法）— 情绪调节、痛苦耐受
- **ACT**（接纳承诺疗法）— 价值澄清、认知解离
- **精神动力学** — 模式识别、防御分析

### 🔀 流派折射
同一个问题，同时看多个流派怎么分析。选择最打动你的角度深入。

### 📊 量表追踪
- PHQ-9 抑郁量表
- GAD-7 焦虑量表
- 症状趋势可视化

### 🛡️ 风险评估
- 每次对话实时风险检测
- 5 级风险分级（None → Imminent）
- 自动危机干预话术
- 安全计划（5 步 CBT 标准）

### 🔧 自定义咨询师
通过 Builder 创建自己的咨询师人格：选择流派、调参风格、设定边界。

---

## 架构

```
ohme/
├── apps/
│   ├── web/              # Next.js 14 + shadcn/ui
│   └── api/              # Nest.js 10 + Prisma + PostgreSQL
├── packages/
│   ├── agent-framework/  # Agent 运行时（多 Provider、Memory、Tool）
│   ├── prompts/          # 五层 Prompt 系统
│   ├── types/            # 共享 TypeScript 类型
│   ├── config/           # ESLint + TSConfig
│   └── observability/    # 日志、链路追踪
├── prisma/               # PostgreSQL Schema
└── docs/
    └── prodution/PRD/    # PRD V1 / V2
```

## 五层 Prompt 系统

```
Layer 1: 基础治疗框架（所有流派共享）
    ↓
Layer 2: 流派特定协议（CBT/DBT/ACT/动力学）
    ↓
Layer 3: 个案概念化注入（动态更新）
    ↓
Layer 4: 会话阶段指令（根据当前 phase）
    ↓
Layer 5: 人格微调（Persona 风格参数）
```

---

## 本地运行

### 前提
- PostgreSQL 14+
- Node.js 20+
- pnpm

### 1. 启动 PostgreSQL

```bash
brew services start postgresql@14

# 创建数据库和用户
psql -U $USER -d postgres -c "CREATE DATABASE ohme;"
psql -U $USER -d postgres -c "CREATE USER ohme WITH PASSWORD 'ohme_dev';"
psql -U $USER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ohme TO ohme;"
psql -U $USER -d postgres -c "ALTER USER ohme CREATEDB;"
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入 LLM Provider API Key
```

### 3. 初始化数据库

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
```

### 4. 启动服务

```bash
# 后端（端口 4000）
pnpm --filter @ohme/api dev

# 前端（端口 3000）— 新终端
pnpm --filter @ohme/web dev
```

打开 http://localhost:3000

---

## LLM Provider 配置

| Provider | 环境变量 | 特点 |
|----------|---------|------|
| **DeepSeek** | `DEEPSEEK_API_KEY` | 推理能力强，价格便宜 |
| **SiliconFlow** | `SILICONFLOW_API_KEY` | 国内直连，超便宜 |
| **Groq** | `GROQ_API_KEY` | 超快推理速度 |
| **OpenRouter** | `OPENROUTER_API_KEY` | 聚合平台，fallback |

设置 `DEFAULT_LLM_PROVIDER` 选择默认提供商，系统会自动降级。

---

## 内置咨询师

| 咨询师 | 流派 | 风格 | 专长 |
|--------|------|------|------|
| **理性之眼** | CBT | 温和直接 | 焦虑、抑郁、完美主义 |
| **温暖之翼** | DBT | 温暖接纳 | 情绪失调、人际关系 |
| **锐锋之剑** | CBT | 犀利挑战 | 回避行为、社交焦虑 |
| **直觉之声** | ACT | 诗意直觉 | 存在主义焦虑、价值冲突 |

---

## 免责声明

OhMe 提供的是心理支持和结构化自助工具，**不是医疗诊断或治疗**。

如果您有自杀或自伤的想法，请立即联系：
- 📞 全国希望 24 热线：**400-161-9995**
- 📞 北京心理危机干预中心：**010-82951332**
- 紧急情况请拨打 **120** 或 **110**

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + shadcn/ui + Tailwind + Recharts |
| 后端 | Nest.js 10 + Prisma |
| 数据库 | PostgreSQL |
| LLM | DeepSeek / SiliconFlow / Groq / OpenRouter（自动降级）|
| 包管理 | pnpm + Turborepo |

---

## 文档

- [PRD V2 — 结构化 AI 心理咨询平台](docs/prodution/PRD/PRD_V2.md)
- [PRD V1 — 多 Stance 精神分析工具](docs/prodution/PRD/PRD_V1.md)（历史版本）
