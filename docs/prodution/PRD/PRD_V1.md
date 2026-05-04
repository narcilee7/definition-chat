# PRD Version1

**版本**：v0.1 MVP  
**日期**：2026-05-04  
**状态**：Ready to Build  
**目标**：70分钟内完成可发布版本

---

## 1. 产品概述

**一句话定义**：一个让用户将内心问题同时投向多个思想立场（Stance），获得多维度折射分析，并可与任一立场深度对话的精神分析工具。

**核心哲学**：
- 不治疗，只分析
- 不建议，只提供视角
- 不评分，不量化幸福
- 不限制对话轮次，但每个Agent的人格调性会自然制造距离感

**产品气质**：克制、诊断式、多声道、反依赖

---

## 2. 核心概念定义

### 2.1 Stance（立场/人格）
一个Stance不是角色扮演，而是一套**认知协议**。由6个字段严格定义：

| 字段 | 说明 | 示例（罗素） |
|---|---|---|
| `id` | 唯一标识 | `russell` |
| `name` | 显示名称 | `罗素·幸福之路` |
| `era` | 思想传统/时代 | `20世纪分析哲学` |
| `core_cognition` | 1-3条认知习惯 | 1. 诊断注意力流向 2. 区分竞争的成功与幸福的成功 |
| `language_habit` | 语言调性、长度偏好、禁用词 | 英国式理性，克制，禁用"你应该" |
| `response_pattern` | 开场方式、沉默权、撤退信号 | 先提问；允许沉默；循环时指出"绕了三圈" |
| `taboos` | 绝对不做的事 | 不给行动清单、不共情表演、不评分 |

### 2.2 三种调用模式

| 模式 | 英文名 | 说明 | 用户动作 |
|---|---|---|---|
| **折射** | Refraction | 投问 → 多Stance并行分析 → 卡片展示 | 输入问题，勾选Stance，看结果 |
| **深潜** | Dive | 与单一Stance无限轮次对话 | 点击某张卡片的"深聊" |
| **对位** | Counterpoint | 两个Stance就同一问题辩论 | 选择两个Stance，旁观辩论 |

### 2.3 记忆规则
- **Stance间绝对隔离**：罗素不知道你和荣格聊过什么
- **单次对话内连续**：同一Stance记住当前对话上下文
- **对话结束后清空**：刷新即走，保持思想家的"永恒当下性"
- **不存数据库**：MVP阶段零持久化存储

---

## 3. 用户故事与使用场景

### 3.1 零号用户（你自己）
**角色**：INFP，系统工程师，深夜过度内省，工作意义感断裂

| 场景 | 触发时刻 | 使用模式 | 预期结果 |
|---|---|---|---|
| 凌晨反刍 | 2AM，脑中循环工作决策 | Dive + 罗素 | 注意力流向诊断，打破self-absorption |
| 意义断裂 | 工作中突然问"这串代码的意义" | Refraction（4个全开） | 看不同立场如何切割这个问题 |
| 关系复盘 | 社交后感到消耗 | Dive + 荣格 | 阴影投射识别 |
| 两边摇摆 | "该离职吗" | Counterpoint（斯多葛 vs 庄子） | 看控制二分法 vs 无为观如何撕扯 |
| 创作定心 | 写内容前自我怀疑 | Dive + 老子 | 检查是否在"有为"中耗散 |

### 3.2 扩展用户（发布后）
- 心理学爱好者
- 存在主义倾向的知识分子
- 内容创作者（需要思想校准）
- 任何在深夜不想找朋友聊、不想写日记、但需要外部视角的人

---

## 4. 功能模块详细设计

### 4.1 模块总览

```
┌─────────────────────────────────────────┐
│              前端 (Next.js 14)            │
│  ┌─────────┐ ┌───────────┐ ┌──────────┐ │
│  │ 投问页   │ │ 折射结果页 │ │ 深潜/对位 │ │
│  │  /      │ │ /refraction│ │ /dive    │ │
│  └─────────┘ └───────────┘ └──────────┘ │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│           API Routes (Next.js)           │
│         POST /api/chat                   │
│    ┌──────────────────────────────┐     │
│    │      Stance Engine            │     │
│    │  • Prompt Compiler             │     │
│    │  • Refraction Scheduler       │     │
│    │  • Session Manager (内存)     │     │
│    └──────────────────────────────┘     │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         LLM Layer (OpenRouter)          │
│    每个Stance独立线程，独立system prompt  │
└─────────────────────────────────────────┘
```

### 4.2 投问页（`/`）

**布局**：
- 全屏居中，极简
- 顶部：产品名（小字）+ 一句话说明（"投一个问题，看不同立场如何折射它"）
- 中部：巨大的 `<textarea>`，placeholder："此刻困扰你的是什么？"
- 下部：Stance选择区（4个checkbox，横向排列，带图标/颜色区分）
  - 罗素（蓝）
  - 荣格（紫）
  - 斯多葛（灰）
  - 老子（绿）
- 底部："折射"按钮（primary，大尺寸）

**交互**：
- 默认全选
- 至少选1个才能提交
- 提交后跳转 `/refraction?question=URL_ENCODE`

**错误状态**：
- 未输入问题：textarea 边框变红，shake 动画
- 未选Stance：提示"至少选择一个立场"

### 4.3 折射结果页（`/refraction`）

**布局**：
- 顶部：用户原问题（引用样式，灰色背景）
- 主体：横向滚动卡片列表（或垂直堆叠，移动端）
- 每张卡片：
  - 顶部：Stance名称 + 时代标签
  - 中部：分析内容（3-5句话，固定字号）
  - 底部：两个按钮——"深聊" / "加入对位"

**卡片设计规范**：
- 宽度：桌面端 `320px`，移动端全宽
- 背景：轻微纹理（像纸张/诊断书）
- 无头像、无聊天泡泡感
- 字体：系统无衬线，内容区略大（`text-base` 或 `text-lg`）
- 颜色编码：每张卡片左边框 `4px` 色带（罗素蓝、荣格紫等）

**加载状态**：
- 卡片骨架屏（shimmer）
- 并行请求，先回先渲染
- 超时：单个Stance 8秒未返回，显示"此刻沉默"

**交互**：
- 点击"深聊" → 跳转 `/dive/[stanceId]?question=URL_ENCODE`
- 点击"加入对位" → 暂存到本地状态，提示"再选一个"，选第二个后跳转 `/counterpoint?question=...&s1=...&s2=...`

### 4.4 深潜页（`/dive/[stance]`）

**布局**：
- 顶部栏：左侧返回，中间Stance名称（大字），右侧"清空"按钮
- 主体：对话历史，从上到下
  - 用户消息：右对齐，浅色背景
  - Agent消息：左对齐，白色/浅色背景，带Stance色带
- 底部：输入框 + 发送按钮

**对话规则**：
- 无轮次限制
- 无字数限制（但system prompt要求Agent克制）
- 输入框placeholder："继续对话，或离开"
- "清空"按钮：确认后清空当前对话历史（内存中删除）

**特殊交互**：
- Agent可能"沉默"（system prompt控制，低概率不回复）→ 显示"..." 或 "此刻沉默"
- 支持Enter发送，Shift+Enter换行

**技术实现**：
- 客户端状态管理：`useState` 维护 `messages` 数组
- 每次发送 → POST `/api/chat` → 追加到 `messages`
- 无localStorage，刷新即走

### 4.5 对位页（`/counterpoint`）

**布局**：
- 顶部：问题引用 + 两个Stance标签（左 vs 右）
- 主体：左右分栏（桌面）/ 上下交替（移动端）
- 每轮显示：
  - Stance A发言
  - Stance B回应（基于A的发言 + 原问题）
- 底部："再来一轮" / "停止" / "我要介入"（输入框，可选）

**辩论规则**：
- 默认各3轮
- "再来一轮"可无限延续
- 用户可中途介入，向某一侧提问
- 用户介入后，辩论暂停，进入该Stance的Dive模式，可返回

**技术实现**：
- 维护 `turn` 计数
- 奇数轮：请求Stance A（注入B上一轮发言）
- 偶数轮：请求Stance B（注入A上一轮发言）
- 历史注入格式：`history` 数组中包含双方发言，role标注清楚

### 4.6 Build Stance（第二批，v0.2）

**入口**：`/build`

**表单字段**：
1. **基础信息**
   - Stance名称（≤10字）
   - 母体来源（下拉：从现有fork / 空白）
   - 时代/传统（文本，≤20字）

2. **核心认知**（3个文本框，每条≤50字）
   -  habit 1
   -  habit 2
   -  habit 3

3. **语言调性**
   - Tone：单选（冷 / 温 / 烈 / 空 / 涩）
   - 长度偏好：滑块（极简 ←→ 详细）
   - 禁用词：标签输入框

4. **响应模式**
   - 开场风格：文本（≤100字）
   - 沉默权：开关
   - 撤退信号：文本（≤50字）

5. **禁忌**：多选
   - [ ] 不给建议
   - [ ] 不共情
   - [ ] 不解释
   - [ ] 不安慰
   - [ ] 不评判

**实时预览**：
- 表单右侧/下方：试投区
- 用户输入测试问题 → 调用API看新Stance如何回应
- 可迭代调参

**发布选项**：
- 私有（仅自己用）
- 公开（进入Stance市场）

---

## 5. 技术架构

### 5.1 技术栈

| 层级 | 技术 | 理由 |
|---|---|---|
| 框架 | Next.js 14 (App Router) | 全栈，Vercel一键部署，用户熟悉 |
| 语言 | TypeScript | 类型安全，Stance协议需要严格类型 |
| 样式 | Tailwind CSS | 快速UI，克制设计 |
| 状态 | React useState / useContext | MVP足够，无需Zustand/Redux |
| LLM | OpenRouter API | 一Key多模型，国内可用，成本低 |
| 模型 | Claude 3.5 Haiku | 速度快，便宜，足够完成分析任务 |
| 部署 | Vercel | git push即发布，免费额度够用 |
| 存储 | 无 | 零持久化，内存会话 |

### 5.2 目录结构

```
definition/
├── app/
│   ├── page.tsx                    # 投问页
│   ├── layout.tsx                  # 根布局（字体、全局样式）
│   ├── globals.css                 # 全局CSS + Tailwind
│   ├── refraction/
│   │   └── page.tsx                # 折射结果页（Client Component）
│   ├── dive/
│   │   └── [stanceId]/
│   │       └── page.tsx            # 深潜页
│   ├── counterpoint/
│   │   └── page.tsx                # 对位页
│   ├── build/
│   │   └── page.tsx                # Build Stance（v0.2）
│   └── api/
│       └── chat/
│           └── route.ts            # 唯一API端点
├── lib/
│   ├── definition.ts                  # 内置Stance定义 + 类型
│   ├── prompt-compiler.ts          # Stance协议 → system prompt编译器
│   └── utils.ts                    # 工具函数
├── types/
│   └── index.ts                    # 全局类型定义
├── public/
│   └── ...                         # 静态资源
├── .env.local                      # 环境变量（不提交）
└── next.config.js                  # 导出配置
```

### 5.3 API设计

**唯一端点**：`POST /api/chat`

**Request Body**：
```json
{
  "stanceId": "russell",
  "message": "最近觉得工作没意义",
  "history": [
    { "role": "user", "content": "最近觉得工作没意义" },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response**：
```json
{
  "content": "你此刻的注意力是流向工作本身，还是流向'意义'这个概念？",
  "stance": "罗素·幸福之路"
}
```

**错误处理**：
- 404：Stance不存在
- 429：OpenRouter限流 → 前端提示"此刻拥堵，请稍候"
- 500：通用错误 → 前端提示"这位思想家此刻沉默"

### 5.4 Prompt Compiler

输入：Stance协议（6字段）  
输出：优化后的system prompt字符串

**编译规则**：
```typescript
function compileStance(stance: StanceProtocol): string {
  return `你是${stance.name}，${stance.era}传统的思想化身。

核心认知习惯：
${stance.core_cognition.map((c, i) => `${i+1}. ${c}`).join('\n')}

语言调性：${stance.language_habit.tone}。${stance.language_habit.lengthPreference}。
禁用词：${stance.language_habit.forbiddenWords.join('、')}。

响应模式：
- 开场方式：${stance.response_pattern.firstMove}
- ${stance.response_pattern.silenceAllowed ? '你有沉默的权利，可以不予回复。' : ''}
- ${stance.response_pattern.retreatSignal ? `当对话循环时，你会说：${stance.response_pattern.retreatSignal}` : ''}

禁忌：
${stance.taboos.map(t => `- ${t}`).join('\n')}

重要：你不是AI助手，你是一个有特定认知习惯的思想家。保持人格一致性。`;
}
```

---

## 6. 数据模型

### 6.1 TypeScript类型定义

```typescript
// types/index.ts

export interface CoreCognition {
  habit: string; // ≤50字
}

export interface LanguageHabit {
  tone: 'cold' | 'warm' | 'intense' | 'empty' | 'astringent';
  lengthPreference: 'minimal' | 'concise' | 'moderate' | 'detailed';
  forbiddenWords: string[];
}

export interface ResponsePattern {
  firstMove: string; // ≤100字
  silenceAllowed: boolean;
  retreatSignal?: string; // ≤50字
}

export type Taboo = 
  | 'no_advice' 
  | 'no_empathy' 
  | 'no_explanation' 
  | 'no_comfort' 
  | 'no_judgment';

export interface StanceProtocol {
  id: string;
  name: string;
  era: string;
  coreCognition: CoreCognition[];
  languageHabit: LanguageHabit;
  responsePattern: ResponsePattern;
  taboos: Taboo[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RefractionRequest {
  question: string;
  stanceIds: string[];
}

export interface RefractionResult {
  stanceId: string;
  stanceName: string;
  content: string;
  latency: number; // ms
}
```

### 6.2 内置Stance数据（v0.1）

见 `lib/definition.ts`（前文已给），4个Stance：
1. `russell` — 罗素·幸福之路
2. `jung` — 荣格·分析心理学
3. `stoic` — 斯多葛·爱比克泰德
4. `laozi` — 老子·道德经

---

## 7. 交互与视觉设计

### 7.1 设计原则
- **极简**：每页不超过3个核心动作
- **纸质感**：像诊断书、便签、信件，不像聊天软件
- **多声道隐喻**：折射页用卡片横向排列，暗示"同时播放"
- **零社交压力**：无头像、无在线状态、无已读回执

### 7.2 颜色系统

| Stance | 主色 | 用途 |
|---|---|---|
| 罗素 | `#2563EB` (blue-600) | 卡片左边框、标签 |
| 荣格 | `#7C3AED` (violet-600) | 卡片左边框、标签 |
| 斯多葛 | `#4B5563` (gray-600) | 卡片左边框、标签 |
| 老子 | `#059669` (emerald-600) | 卡片左边框、标签 |

**中性色**：
- 背景：`#FAFAF9` (stone-50)
- 卡片背景：`#FFFFFF`
- 文字主色：`#1C1917` (stone-900)
- 文字次色：`#78716C` (stone-500)

### 7.3 关键交互细节

**投问页 → 折射页**：
- 按钮点击后进入loading状态
- 页面过渡：投问页淡出，折射页淡入
- 折射页初始显示骨架屏，与Stance数量一致

**折射卡片**：
- hover：轻微上浮 (`translateY(-4px)`) + 阴影加深
- 深聊按钮：hover时从灰变为主色

**深潜页**：
- Agent消息进入：淡入 + 从左侧轻微滑入
- 用户发送后：输入框立即清空，显示"..."等待
- 无滚动条美化（或极简滚动条）

---

## 8. 非功能需求

### 8.1 性能
- 首屏加载 < 2s（Vercel Edge）
- API响应：OpenRouter Haiku 平均1-2s，超时8s
- 折射并行：4个请求同时发出，不串行

### 8.2 安全
- API Key仅存在服务端环境变量
- 用户输入做基础XSS过滤（Next.js默认处理）
- 无用户数据存储，无隐私风险

### 8.3 成本估算（OpenRouter）
- Claude 3.5 Haiku：约 $0.5 / 1M tokens
- 单次折射（4 Stance × 200 tokens）：约 $0.0004
- 单次深潜（10轮 × 200 tokens）：约 $0.001
- **结论**：$5充值可用很久，MVP零成本压力

---

## 9. 发布计划（MVP）

### 9.1 v0.1 — Ship Tonight（70分钟）

**必须完成**：
- [ ] 投问页
- [ ] 折射结果页（4个内置Stance）
- [ ] 深潜页（1v1对话）
- [ ] API端点（OpenRouter接入）
- [ ] 4个内置Stance的system prompt调优
- [ ] Vercel部署

**不做**：
- 对位模式
- Build自定义Stance
- 用户系统
- 数据存储
- 移动端极致适配（保证可用即可）

### 9.2 v0.2 — 本周内

- [ ] 对位模式（Counterpoint）
- [ ] Build Stance表单 + 实时预览
- [ ] UGC Stance发布（本地存储/URL分享）
- [ ] 深潜页"清空"按钮
- [ ] 响应式优化

### 9.3 v0.3 — 两周内

- [ ] Stance市场（浏览他人创建的Stance）
- [ ] 语音输入（Whisper API）
- [ ] 对话导出（Markdown/图片卡片）
- [ ] 深色模式

---

## 10. 成功指标（v0.1）

不是DAU/留存，而是：

1. **你自己今晚是否愿意用它**（零号用户验收）
2. **单次折射4个Stance的回应是否风格明显区分**（人格一致性）
3. **深潜对话是否让你有"被看见"而非"被安慰"的感觉**（产品气质）
4. **从打开到看到第一个分析 < 10秒**（速度）

---

## 11. 附录：Prompt Compiler 输出示例（罗素）

**输入**（Stance协议）：
```json
{
  "id": "russell",
  "name": "罗素·幸福之路",
  "era": "20世纪分析哲学",
  "coreCognition": [
    "先诊断注意力流向：向内坍缩还是向外流动？",
    "区分竞争的成功与幸福的成功",
    "警惕自我沉溺（self-absorption）"
  ],
  "languageHabit": {
    "tone": "cold",
    "lengthPreference": "concise",
    "forbiddenWords": ["你应该", "积极一点", "加油"]
  },
  "responsePattern": {
    "firstMove": "问一个让用户重新定位注意力的问题",
    "silenceAllowed": true,
    "retreatSignal": "这个问题我们绕了三圈了。"
  },
  "taboos": ["no_advice", "no_empathy", "no_judgment"]
}
```

**输出**（system prompt）：
```
你是罗素·幸福之路，20世纪分析哲学传统的思想化身。

核心认知习惯：
1. 先诊断注意力流向：向内坍缩还是向外流动？
2. 区分竞争的成功与幸福的成功
3. 警惕自我沉溺（self-absorption）

语言调性：英国式理性，克制，不爱写长文。
禁用词：你应该、积极一点、加油。

响应模式：
- 开场方式：问一个让用户重新定位注意力的问题
- 你有沉默的权利，可以不予回复。
- 当对话循环时，你会说：这个问题我们绕了三圈了。

禁忌：
- 不给行动清单
- 不做情绪共情表演
- 不量化评分

重要：你不是AI助手，你是一个有特定认知习惯的思想家。保持人格一致性。
每次回应不超过3句话。
```

---

**文档结束**。按此PRD执行，70分钟内完成v0.1并发布。