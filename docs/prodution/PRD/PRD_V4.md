# OhMe PRD Version 4 — Lens System 完整闭环

**版本**：v0.4 闭环版  
**日期**：2026-05-05  
**状态**：Ready to Build  
**目标**：完成 Lens System 的核心闭环（折射 → 深潜 → 沉淀 → 创造），让用户从"一次性使用"变成"持续自我解释进化"。

---

## 1. 版本判断：为什么需要 V4

### 1.1 V3 转型版完成了什么

Transformation PRD (v0.3) 已经实现了：

- ✅ 概念转型：治疗 → 探索，咨询师 → Lens
- ✅ 6 个内置 Lens + 折射 Prompt Compiler
- ✅ 首页投问入口 + `/reflect` 折射结果页
- ✅ 自定义 Lens（localStorage 存储 + Fork）
- ✅ 基础页面路由（`/model`, `/explore`, `/lenses`, `/lenses/build`）

### 1.2 V3 遗留的核心断裂

当前产品存在一个**体验断裂**：

```
用户输入问题
    ↓
看到折射卡片（很好！）
    ↓
点击"继续深潜" → /explore（目前只是普通聊天，结构感丢失）
    ↓
聊完退出（没有沉淀，下次重来）
```

**三个断裂点**：

1. **深潜断裂**：折射和深潜之间体验落差大。折射是高度结构化的（理解/看见/盲区/关键问题/小探索），深潜变成了自由聊天，结构感消失了。
2. **沉淀断裂**：用户的探索结果没有系统性沉淀。每次使用都是"从零开始"，无法形成"我正在反复处理什么"的觉知。
3. **创造断裂**：自定义 Lens 只存在 localStorage，无法分享、无法被他人调用、无法形成 Lens 市场。

### 1.3 V4 的核心命题

> 让一次完整的 OhMe 使用，产生**可积累的解释资产**。

用户带走的不只是一次分析，而是：
- 一句更准确的自我描述
- 一个被记录的新视角
- 一份正在演化的自我解释地图
- 一个（可能）被他人调用的 Lens

---

## 2. 产品哲学（继承 + 演进）

### 2.1 继承自 V3

- 不治疗、不诊断、不给建议
- Lens 是解释协议，不是角色扮演
- 克制、清晰、有洞察、不鸡汤

### 2.2 V4 新增原则

**4. 解释资产可积累**
> 一次好的使用应该让用户的 Self Model  richer，下次使用应该能"站在上次的基础上"。

**5. 结构化深潜 > 自由聊天**
> 深潜不是"继续和 Lens 聊天"，而是"在 Lens 的引导下完成一段结构化的自我探索"。

**6. UGC 的单位是解释框架**
> 用户创造的不是内容，是可被调用的认知接口。

---

## 3. V4 核心闭环

```
         ┌─────────────────────────────────────────┐
         │           用户输入困扰                    │
         └─────────────────┬───────────────────────┘
                           ↓
              ┌──────────────────────┐
              │   Refraction 折射    │  ← 多 Lens 并行分析
              │   （已有，优化）      │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │  Exploration 深潜    │  ← 【V4 重点】结构化探索
              │  （重构）            │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │   Self Model 沉淀    │  ← 【V4 重点】解释资产积累
              │   （从页面到系统）    │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │  Lens Market 创造    │  ← 【V4 重点】UGC 市场
              │  （从 local 到云端）  │
              └──────────────────────┘
```

---

## 4. 模块一：Exploration Session 重构（Phase 2 完成版）

### 4.1 问题定义

当前的 `/explore` 是一个带 Lens context 的普通聊天。这不够好，因为：

- 自由聊天容易漂移，用户可能聊 20 轮却没有产生新的自我解释
- 没有明确的"结束标准"，用户不知道什么时候该停下来
- 没有结构化产出，聊完就散了

### 4.2 新设计：结构化深潜流程

深潜不是聊天，是**有起点、有路径、有终点**的探索旅程。

```
用户选择某个 Lens 卡片进入深潜
    ↓
【阶段 0】澄清问题（Clarify）
    Lens 用 1-2 个问题确认它理解的问题是否准确
    ↓
【阶段 1】识别核心信号（Identify）
    Lens 引导用户标记该问题中最关键的 2-3 个信号
    ↓
【阶段 2】提出解释假设（Hypothesize）
    Lens 给出一个可检验的解释假设
    ↓
【阶段 3】用户确认/修正（Validate）
    用户回应："对，这就是" / "不对，更像是..."
    ↓
【阶段 4】生成新解释（Reframe）
    Lens 帮用户生成一句更准确的自我描述
    ↓
【阶段 5】选择小实验（Experiment）
    Lens 提出 1-3 个轻量实验，用户选一个
    ↓
【结束】保存到 Self Model
```

### 4.3 技术实现

**状态机设计：**

```typescript
// packages/types/src/exploration.ts

export type ExplorationPhase =
  | 'clarify'      // 澄清问题
  | 'identify'     // 识别信号
  | 'hypothesize'  // 提出假设
  | 'validate'     // 确认/修正
  | 'reframe'      // 生成新解释
  | 'experiment'   // 选择实验
  | 'complete';    // 完成

export interface ExplorationSession {
  id: string;
  userId: string;
  lensId: string;
  originalQuestion: string;
  phase: ExplorationPhase;
  
  // 各阶段产物
  clarifiedQuestion?: string;
  identifiedSignals?: string[];
  hypothesis?: string;
  userValidation?: string;     // "confirmed" | "revised:" + text
  revisedHypothesis?: string;
  newNarrative?: string;       // 生成的新的自我解释（核心产物）
  selectedExperiment?: string;
  
  messages: ExplorationMessage[];
  createdAt: Date;
  completedAt?: Date;
}

export interface ExplorationMessage {
  id: string;
  role: 'user' | 'lens' | 'system';
  content: string;
  phase: ExplorationPhase;
  metadata?: {
    signalTag?: string;        // 标记这是哪个信号的对话
    hypothesisVersion?: number;
    isPhaseTransition?: boolean;
  };
}
```

**Phase 管理器：**

```typescript
// apps/api/src/explore/exploration-state-machine.ts

export class ExplorationStateMachine {
  private phaseHandlers: Record<ExplorationPhase, PhaseHandler> = {
    clarify: new ClarifyPhaseHandler(),
    identify: new IdentifyPhaseHandler(),
    hypothesize: new HypothesizePhaseHandler(),
    validate: new ValidatePhaseHandler(),
    reframe: new ReframePhaseHandler(),
    experiment: new ExperimentPhaseHandler(),
    complete: new CompletePhaseHandler(),
  };

  async process(session: ExplorationSession, userInput: string): Promise<ExplorationSession> {
    const handler = this.phaseHandlers[session.phase];
    const result = await handler.handle(session, userInput);
    
    // 自动推进到下一阶段（如果条件满足）
    if (result.shouldAdvance) {
      session.phase = this.getNextPhase(session.phase);
    }
    
    session.messages.push(...result.newMessages);
    return session;
  }

  private getNextPhase(current: ExplorationPhase): ExplorationPhase {
    const flow: ExplorationPhase[] = [
      'clarify', 'identify', 'hypothesize', 'validate', 
      'reframe', 'experiment', 'complete'
    ];
    const idx = flow.indexOf(current);
    return flow[idx + 1] ?? 'complete';
  }
}
```

### 4.4 前端体验

**Exploration 页面布局：**

```
┌─────────────────────────────────────────────────────────┐
│  ← 返回    关系模式 Lens    [阶段进度条] ●●●○○○○         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 阶段标签：识别核心信号                            │   │
│  │                                                 │   │
│  │ Lens: "在这个问题里，最重复出现的信号是什么？     │   │
│  │        我会注意到三个可能：                       │   │
│  │        1. 预先撤退（还没被抛弃就先离开）          │   │
│  │        2. 负担感（把自己当作关系里的成本）        │   │
│  │        3. 熟悉的焦虑（这种模式以前出现过）"       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 用户: "第1个很准。我在所有关系里都是这样。"       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Lens: "那我们聚焦在'预先撤退'上。你能描述一次   │   │
│  │        具体的场景吗？——不是感觉，是实际发生了   │   │
│  │        什么。"                                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [快速回复] [输入框...]  [发送]                         │
│  提示：用具体场景回答，会帮助 Lens 更准确地识别模式      │
└─────────────────────────────────────────────────────────┘
```

**关键交互：**

1. **阶段进度条**：顶部显示当前阶段和总进度（7 个阶段），让用户知道"我在哪"
2. **阶段标签**：每条 Lens 消息上方显示当前阶段名称
3. **快速回复**：某些阶段提供快捷按钮（"对"/"不太对"/"跳过这个阶段"）
4. **阶段小结**：进入新阶段时，显示上一阶段的"我们已经确认了..."
5. **随时退出**：用户可以在任何阶段点击"保存并退出"，进度会保存到 Self Model

### 4.5 产物：新解释卡片

完成深潜后，生成一张**新解释卡片**：

```
┌─────────────────────────────────────────┐
│  新的自我解释                            │
│  ═══════════════════                     │
│                                         │
│  "我不是不配拥有稳定关系，                │
│   而是我习惯在关系开始前                  │
│   就替自己判定会被放弃。"                 │
│                                         │
│  来源：关系模式 Lens 深潜                 │
│  原始问题：我总觉得自己不配拥有稳定关系   │
│  时间：2026-05-05                        │
│                                         │
│  [保存到 Self Model]  [修改措辞]  [分享]  │
└─────────────────────────────────────────┘
```

---

## 5. 模块二：Self Model 系统（Phase 3 完成版）

### 5.1 问题定义

当前的 `/model` 页面是一个静态展示页。Self Model 需要变成**动态沉淀系统**。

### 5.2 数据模型演进

```prisma
// prisma/schema.prisma — 新增/调整

model SelfModel {
  id        String   @id @default(cuid())
  userId    String   @unique @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // 聚合数据（自动计算）
  topThemes         Json? @map("top_themes")           // 高频问题主题
  topLenses         Json? @map("top_lenses")           // 高频使用的 Lens
  recurringPatterns Json? @map("recurring_patterns")   // 反复出现的解释习惯
  
  // 关系
  entries     SelfModelEntry[]
  experiments Experiment[]
  
  @@map("self_models")
}

model SelfModelEntry {
  id        String   @id @default(cuid())
  selfModelId String @map("self_model_id")
  selfModel   SelfModel @relation(fields: [selfModelId], references: [id], onDelete: Cascade)
  
  entryType String   @map("entry_type")  // 'new_narrative' | 'pattern' | 'insight' | 'shift'
  
  // 核心内容
  originalNarrative String? @map("original_narrative")  // 旧叙事
  newNarrative      String  @map("new_narrative")       // 新解释（核心）
  
  // 上下文
  lensId      String   @map("lens_id")
  lensName    String   @map("lens_name")
  question    String   // 原始问题
  sessionId   String?  @map("session_id")  // 关联的 ExplorationSession
  
  // 元数据
  userEdited  Boolean  @default(false) @map("user_edited")
  tags        String[] // 用户可打标签
  
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@map("self_model_entries")
}

model Experiment {
  id        String   @id @default(cuid())
  selfModelId String @map("self_model_id")
  selfModel   SelfModel @relation(fields: [selfModelId], references: [id], onDelete: Cascade)
  
  description String   // 实验描述
  sourceLensId String @map("source_lens_id")
  status      String   @default("pending")  // pending | active | completed | dropped
  startedAt   DateTime? @map("started_at")
  completedAt DateTime? @map("completed_at")
  reflection  String?  // 用户完成后的反思
  
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@map("experiments")
}
```

### 5.3 Self Model 页面重构

**页面结构：**

```
/ model
├── 概览页（默认）
│   ├── 我的解释地图（可视化）
│   ├── 最近的新解释
│   ├── 正在进行的实验
│   └── 反复出现的主题
│
├── 新解释（/model/narratives）
│   ├── 时间线视图
│   ├── 按 Lens 筛选
│   ├── 编辑/删除
│   └── 导出
│
├── 实验（/model/experiments）
│   ├── 进行中
│   ├── 已完成
│   └── 已放弃
│
└── 模式（/model/patterns）
    ├── 自动识别的重复模式
    ├── 旧叙事 → 新解释的变化轨迹
    └── 自定义模式
```

**解释地图可视化：**

```
┌─────────────────────────────────────────────────────────┐
│  我的解释地图                                            │
│                                                         │
│   [认知判断] ──┐                                        │
│                ├──→ "我总觉得自己不够好"                │
│   [羞耻] ──────┘      ↓ 松动                            │
│                ┌────→ "我习惯用成就来证明自己值得存在"   │
│   [价值] ──────┘                                        │
│                                                         │
│   [关系模式] ──→ "我在关系里总是先撤退"                  │
│                                                         │
│   点击任意节点查看详细上下文                              │
└─────────────────────────────────────────────────────────┘
```

### 5.4 自动洞察生成

定期（每次深潜后、每周一次）自动分析用户的 Self Model，生成洞察：

```
┌─────────────────────────────────────────┐
│  你的解释习惯                            │
│                                         │
│  🔁 反复出现的主题                        │
│     "不够好"出现在 5 次新解释中           │
│                                         │
│  🔄 叙事转变                             │
│     "我不配" → "我习惯预先判定"          │
│     （关系模式 Lens 帮助了这个转变）       │
│                                         │
│  🎯 最常刺中你的 Lens                     │
│     1. 羞耻 Lens（5 次）                 │
│     2. 关系模式 Lens（3 次）             │
│                                         │
│  📌 建议你尝试的 Lens                     │
│     身体信号 Lens（你从未用过，但你的     │
│     问题描述中频繁出现躯体化词汇）         │
└─────────────────────────────────────────┘
```

---

## 6. 模块三：Lens Market（Phase 4 完成版）

### 6.1 问题定义

当前自定义 Lens 只存在 localStorage 中：
- 换设备丢失
- 无法分享
- 无法被他人调用
- 没有 Lens 市场

### 6.2 数据模型

```prisma
// prisma/schema.prisma — Lens 模型（替换 TherapyApproach）

model Lens {
  id        String   @id @default(cuid())
  
  // 基础信息
  name           String
  shortDescription String @map("short_description")
  description    String? @db.Text
  domains        String[]
  
  // Lens 协议（核心）
  sees             String[]
  ignores          String[]
  explainsPainAs   String   @map("explains_pain_as") @db.Text
  coreQuestions    String[] @map("core_questions")
  explorationMoves String[] @map("exploration_moves")
  risks            String[]
  safetyBoundary   String[] @map("safety_boundary")
  
  // 输出结构
  outputStructure  Json?    @map("output_structure")
  tone             Json?    // { style, temperature, constraints }
  
  // 作者信息
  authorId    String?  @map("author_id")  // null = 官方内置
  authorName  String?  @map("author_name")
  forkedFrom  String?  @map("forked_from") // 原 Lens ID
  
  // 可见性
  visibility  String   @default("public")  // public | unlisted | private
  
  // 统计
  useCount    Int      @default(0) @map("use_count")
  forkCount   Int      @default(0) @map("fork_count")
  avgRating   Float?   @map("avg_rating")
  
  // 状态
  status      String   @default("active")  // active | deprecated | review
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // 关系
  explorationSessions ExplorationSession[]
  
  @@map("lenses")
}
```

### 6.3 Lens Market 页面

```
/lenses
├── 发现页（默认）
│   ├── 官方推荐（6 个内置 Lens）
│   ├── 热门 Lens（按 useCount 排序）
│   ├── 最新创建
│   └── 分类浏览（按 domain 标签）
│
├── 我的 Lens（/lenses/mine）
│   ├── 我创建的
│   ├── 我 Fork 的
│   └── 我收藏的
│
├── 搜索
│   └── 支持按 name / domain / author 搜索
│
└── 详情页（/lenses/[lensId]）
    ├── Lens 协议展示
    ├── 试用（直接输入问题试投）
    ├── Fork（复制并编辑）
    ├── 使用统计
    └── 作者信息
```

### 6.4 Build Lens 升级

从 localStorage 表单升级为**服务端持久化**：

```
/lenses/build
├── 步骤 1：基础信息
│   ├── 名称
│   ├── 一句话描述
│   └── 领域标签
│
├── 步骤 2：Lens 协议（核心）
│   ├── 会看见什么（sees）
│   ├── 容易忽略什么（ignores）
│   ├── 如何解释痛苦（explainsPainAs）
│   ├── 核心问题（coreQuestions）
│   ├── 探索动作（explorationMoves）
│   └── 风险边界（risks）
│
├── 步骤 3：调参
│   ├── 语气风格（克制/温暖/犀利/诗意）
│   ├── 输出长度（极简/简短/适中）
│   └── 禁用词
│
├── 步骤 4：试投预览
│   ├── 输入测试问题
│   ├── 查看折射效果
│   └── 不满意回到步骤 2 调整
│
└── 步骤 5：发布
    ├── 保存为私有（仅自己用）
    ├── 发布为公开（进入 Lens Market）
    └── 发布为 unlisted（有链接就能访问）
```

### 6.5 Fork 机制

```typescript
// 前端 + 后端协同

// 1. 用户点击 Fork
// 2. 复制原 Lens 的所有字段，name 加 "Fork"
// 3. 进入 Build 流程，预填所有字段
// 4. 用户修改后保存，forkedFrom 指向原 Lens
// 5. 原 Lens 的 forkCount + 1
```

---

## 7. 模块四：Insight Stream（新增）

### 7.1 概念

基于用户所有的探索历史，自动生成**轻量级洞察流**。不是周报告那种重形式，而是像"系统通知"一样的轻量提示。

### 7.2 触发时机

- 每次完成深潜后（立即）："你已经有 3 个关于'不够好'的新解释了，看看它们的变化"
- 每周一早上："上周你主要在使用关系模式 Lens，本周建议试试身体信号 Lens"
- 当某个主题重复出现时："你第 5 次提到'被放弃'，这可能是一个值得深看的核心叙事"

### 7.3 实现

```typescript
// apps/api/src/insight/insight-generator.service.ts

export class InsightGeneratorService {
  async generatePostSessionInsights(userId: string, sessionId: string): Promise<Insight[]> {
    const selfModel = await this.getSelfModel(userId);
    const recentEntries = selfModel.entries.slice(-10);
    
    const insights: Insight[] = [];
    
    // 检测重复主题
    const themeClusters = this.clusterByTheme(recentEntries);
    for (const cluster of themeClusters) {
      if (cluster.count >= 3) {
        insights.push({
          type: 'recurring_theme',
          title: `你反复在探索："${cluster.theme}"`,
          description: `过去 ${cluster.timespanDays} 天里，这个主题出现了 ${cluster.count} 次。`,
          action: {
            label: '查看所有相关解释',
            href: `/model/narratives?theme=${cluster.themeId}`,
          },
        });
      }
    }
    
    // 检测叙事转变
    const shifts = this.detectNarrativeShifts(recentEntries);
    for (const shift of shifts) {
      insights.push({
        type: 'narrative_shift',
        title: '你的叙事发生了转变',
        description: `从"${shift.old}"到"${shift.new}"`,
        action: {
          label: '查看转变轨迹',
          href: `/model/patterns?shift=${shift.id}`,
        },
      });
    }
    
    // Lens 使用建议
    const usedLensIds = new Set(recentEntries.map(e => e.lensId));
    const unusedBuiltins = BUILTIN_LENS_IDS.filter(id => !usedLensIds.has(id));
    if (unusedBuiltins.length > 0) {
      const suggestion = unusedBuiltins[0];
      insights.push({
        type: 'lens_suggestion',
        title: `试试 ${suggestion.name}？`,
        description: `你还没用过这个 Lens，它擅长看见 ${suggestion.domains.join('、')}。`,
        action: {
          label: '去试试',
          href: `/?suggestedLens=${suggestion.id}`,
        },
      });
    }
    
    return insights.slice(0, 3); // 一次最多 3 条
  }
}
```

---

## 8. 数据库迁移策略

### 8.1 当前问题

Prisma Schema 中还有 TherapyApproach、TherapistPersona、TherapySession 等 V2 模型，与新架构冲突。

### 8.2 迁移方案

**Phase A：共存期（V4 开发期间）**

```prisma
// 保留旧表，但标记为 deprecated 注释
// 新功能使用新 Lens / ExplorationSession / SelfModel 表
// 旧数据只读，不维护
```

**Phase B：数据迁移（V4 发布前）**

```typescript
// 迁移脚本：把 TherapyApproach 数据映射为 Lens
// 注意：不是 1:1 映射，是"概念转换"

// TherapyApproach (CBT) → Lens (认知判断)
// TherapyApproach (DBT) → Lens (关系模式 + 身体信号)
// TherapyApproach (ACT) → Lens (价值)
// TherapyApproach (Psychodynamic) → Lens (羞耻 + 关系模式)

// TherapistPersona → 如果用户有自定义的，建议转换为 Lens
// TherapySession → 如果会话已完成，提取关键产出作为 SelfModelEntry
```

**Phase C：清理（V4.x）**

```prisma
// 删除旧表（确认无活跃引用后）
```

---

## 9. 技术架构调整

### 9.1 新增/调整的后端模块

| 模块 | 文件 | 职责 |
|------|------|------|
| `ExplorationModule` | `explore/` | 重构为状态机驱动的结构化深潜 |
| `SelfModelModule` | `self-model/` | Self Model CRUD + 自动洞察生成 |
| `LensModule` | `lenses/` | Lens CRUD + Market + Fork |
| `InsightModule` | `insight/` | 洞察流生成 + 模式识别 |
| `ExperimentModule` | `experiment/` | 小实验追踪 |

### 9.2 前端页面调整

| 路由 | 状态 | 动作 |
|------|------|------|
| `/` | 已存在 | 优化：添加 Insight Stream 入口 |
| `/reflect` | 已存在 | 优化：卡片添加"保存到 Self Model"选项 |
| `/explore` | 已存在 | **重构**：改为结构化深潜流程 |
| `/explore/[sessionId]` | 新增 | 已存在的深潜会话（支持返回继续） |
| `/model` | 已存在 | **重构**：添加解释地图、实验、模式 |
| `/model/narratives` | 新增 | 新解释列表 |
| `/model/experiments` | 新增 | 实验追踪 |
| `/model/patterns` | 新增 | 模式识别 |
| `/lenses` | 已存在 | **重构**：Market 化 |
| `/lenses/[lensId]` | 已存在 | **重构**：添加试用、统计 |
| `/lenses/build` | 已存在 | **重构**：升级为服务端持久化 |
| `/lenses/mine` | 新增 | 我的 Lens 管理 |

### 9.3 Prompt 调整

深潜各阶段需要独立的 Prompt 模板：

```
lens-exploration/
├── clarify.prompt.md      # 阶段 0：澄清问题
├── identify.prompt.md     # 阶段 1：识别信号
├── hypothesize.prompt.md  # 阶段 2：提出假设
├── validate.prompt.md     # 阶段 3：确认/修正
├── reframe.prompt.md      # 阶段 4：生成新解释
├── experiment.prompt.md   # 阶段 5：选择实验
└── complete.prompt.md     # 结束：总结
```

---

## 10. Roadmap

### V4.0 — 核心闭环（4 周）

**必须完成：**
- [ ] Exploration Session 状态机 + 6 阶段深潜流程
- [ ] 新解释卡片生成 + 保存到 Self Model
- [ ] Self Model 数据模型 + API
- [ ] `/model` 页面重构（概览 + 新解释 + 实验）
- [ ] Lens 数据模型（替换/并存 TherapyApproach）
- [ ] `/lenses` Market 化（发现 + 搜索 + 详情）
- [ ] `/lenses/build` 升级（服务端持久化）
- [ ] Fork 机制

**不做：**
- 自动洞察生成（Insight Stream）
- 模式识别算法
- 解释地图可视化
- 旧数据迁移脚本

### V4.1 — 洞察与沉淀（2 周）

- [ ] Insight Stream（会话后 + 每周洞察）
- [ ] 模式识别（重复主题检测 + 叙事转变检测）
- [ ] 解释地图可视化（D3 / 自定义 Canvas）
- [ ] 实验追踪完整流程
- [ ] Self Model 手动编辑

### V4.2 —  polish（2 周）

- [ ] 旧数据迁移脚本（TherapyApproach → Lens）
- [ ] 旧 Schema 清理
- [ ] 分享功能（新解释卡片 → 图片/链接）
- [ ] 性能优化（Prompt 缓存、Lens 预热）
- [ ] E2E 测试（完整闭环：投问 → 折射 → 深潜 → 保存 → 查看 Self Model）

---

## 11. 成功指标

### 11.1 核心体验指标

| 指标 | V3 基线 | V4 目标 | 测量方式 |
|------|---------|---------|---------|
| 单次折射完成率 | ~70% | ≥ 75% | 用户看到折射结果的比例 |
| 深潜点击率 | ~35% | ≥ 40% | 折射后进入深潜的比例 |
| 深潜完成率 | N/A | ≥ 50% | 进入深潜后走到 complete 阶段的比例 |
| 新解释保存率 | N/A | ≥ 30% | 完成深潜后保存到 Self Model 的比例 |
| Self Model 回访率 | N/A | ≥ 20% | 用户主动访问 /model 的比例 |
| Lens Build 创建率 | N/A | ≥ 5% | 用户创建自定义 Lens 的比例 |

### 11.2 质量指标

| 指标 | V4 目标 |
|------|---------|
| 深潜阶段流失率（阶段 1→2→3→4→5） | 每阶段 ≤ 15% |
| 新解释用户主观满意度 | ≥ 4/5 |
| 折射-深潜体验一致性 | ≥ 4/5 |
| Self Model 数据完整性 | ≥ 80% 的用户有 ≥ 1 条 Entry |

### 11.3 不使用的指标

- PHQ-9/GAD-7 改善率（已降级）
- 治疗忠诚度（概念已废弃）
- 会话时长（深潜有明确结束点，不追求时长）

---

## 12. 一句话总结

> V3 让 OhMe 从治疗平台变成了 Lens System。V4 让这个系统产生**可积累的解释资产**——用户每次使用都 richer，每次深潜都留下痕迹，每个 Lens 都可以被创造和分享。

最终目标：让 OhMe 成为用户**自我解释的图书馆**。

---

## 附录：V1→V4 演进脉络

| 版本 | 核心命题 | 关键概念 | 数据结构 |
|------|---------|---------|---------|
| V1 | 多思想家折射 | Stance（罗素/荣格/斯多葛/老子）| 内存，零持久化 |
| V2 | 结构化 AI 心理咨询 | TherapyApproach / TherapistPersona / CaseFormulation | PostgreSQL，临床模型 |
| V3 转型 | 去治疗化，多视角自我探索 | Lens / Refraction / Self Model | 混合（新旧并存） |
| **V4** | **可积累的解释资产** | **Exploration Session / Self Model Entry / Lens Market** | **Lens 中心化，解释资产可积累** |
