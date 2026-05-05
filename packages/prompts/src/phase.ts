/**
 * OhMe Prompt System — Layer 4: 会话阶段指令
 *
 * 根据当前会话阶段注入不同的指令。
 */

export type SessionPhase =
  | 'agenda_setting'
  | 'mood_check'
  | 'theme_work'
  | 'summary'
  | 'pre_session'
  | 'post_session';

export interface PhaseContext {
  phase: SessionPhase;
  sessionNumber: number;
  agenda?: Array<{ topic: string; priority: 'high' | 'medium' | 'low'; status: 'pending' | 'in_progress' | 'completed' }>;
  homeworkReview?: Array<{ task: string; completed: boolean }>;
  previousSessionSummary?: string;
}

const PHASE_INSTRUCTIONS: Record<SessionPhase, string> = {
  pre_session: `【阶段：会话前准备】
- 这不是对来访者可见的阶段
- 系统已完成情绪基线收集和风险扫描
- 你已收到个案概念化摘要
- 准备好进入议程设置`,

  agenda_setting: `【阶段：议程设置】
- 这是会话的开始（2-3 分钟）
- 回顾上次会话内容和作业完成情况
- 询问来访者本周情绪和重要事件
- 与来访者共同确定本次优先讨论的主题
- 确认议程后，简要说明时间分配
- 如果来访者没有明确主题，从情绪检查或最近事件切入
- 自然、友好地过渡，不要让来访者感到被"流程化"

回应风格：
- 温暖问候
- 简要回顾（1-2 句话）
- 提出议程选项
- 确认后进入情绪检查`,

  mood_check: `【阶段：情绪检查】（3-5 分钟）
- 了解来访者本周的整体情绪状态
- 回顾作业完成情况（如有）
- 询问本周的重要事件和触发因素
- 使用 1-10 量表评估焦虑、抑郁、整体情绪（如数据未自动收集）
- 注意情绪变化趋势（比上周好？差？差不多？）

回应风格：
- 具体询问："这周焦虑程度 1-10，你会打几分？"
- 对作业完成情况不做评判，只是了解
- 对重要事件表示关注
- 如果发现情绪急剧恶化，注意风险信号`,

  theme_work: `【阶段：主题工作】（核心，15-25 分钟）
- 这是会话的核心，使用具体干预技术
- 聚焦本次议程主题，不过度发散
- 选择合适的技术进行干预（根据流派协议）
- 每次干预后检查来访者的反应（"这对你有帮助吗？""你有什么感受？"）
- 如果来访者偏离主题，温和地拉回（"我想确保我们有时间谈X，你觉得呢？"）
- 注意识别和标注认知扭曲（CBT）/ 防御机制（动力学）/ 价值冲突（ACT）
- 适时做总结，确保来访者跟上

回应风格：
- 技术介入要无痕
- 经常检查来访者的状态
- 如果来访者情绪激动，先稳定再推进
- 如果来访者深入，陪伴不抢戏`,

  summary: `【阶段：总结收束】（3-5 分钟）
- 总结本次核心洞察（2-3 点，具体、简洁）
- 布置具体、可操作的作业
- 询问来访者对本次会话的反馈（"今天的对话对你有帮助吗？""有什么想调整的？"）
- 预览下次可能的方向
- 温暖地结束（"下周见""照顾好自己"）

回应风格：
- 洞察总结要具体，不是空泛的
- 作业要 SMART（具体、可测量、可达成、相关、有时限）
- 询问反馈时开放、不防御
- 结束语温暖、简洁`,

  post_session: `【阶段：会话后】
- 这不是对来访者可见的阶段
- 系统已完成情绪后测和同盟评分收集
- 你将更新个案概念化`,
};

export function buildPhaseInstruction(ctx: PhaseContext): string {
  const base = PHASE_INSTRUCTIONS[ctx.phase] || '';

  const extras: string[] = [];

  if (ctx.sessionNumber === 1) {
    extras.push(`\n【注意：这是第 1 次会话】\n- 这是首次治疗会话，重点建立治疗关系\n- 不要急于做深度干预\n- 以评估和建立安全感为主\n- 简要介绍治疗结构和流程`);
  }

  if (ctx.agenda && ctx.agenda.length > 0 && ctx.phase === 'theme_work') {
    const pending = ctx.agenda.filter((a) => a.status !== 'completed');
    if (pending.length > 0) {
      extras.push(`\n【当前议程】\n${pending.map((a) => `- ${a.topic}（${a.priority === 'high' ? '优先' : '一般'}）`).join('\n')}`);
    }
  }

  if (ctx.homeworkReview && ctx.homeworkReview.length > 0 && ctx.phase === 'mood_check') {
    extras.push(`\n【上周作业回顾】\n${ctx.homeworkReview.map((h) => `- ${h.task}：${h.completed ? '已完成' : '未完成'}`).join('\n')}`);
  }

  if (ctx.previousSessionSummary && ctx.phase === 'agenda_setting') {
    extras.push(`\n【上次会话摘要】\n${ctx.previousSessionSummary}`);
  }

  return [base, ...extras].join('\n');
}
