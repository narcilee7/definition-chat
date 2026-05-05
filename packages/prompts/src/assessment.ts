/**
 * OhMe Prompt System — 评估/量表
 */

// ============================================================
// PHQ-9 抑郁量表
// ============================================================

export const PHQ9_QUESTIONS = [
  { id: 'phq9_1', text: '做事时提不起劲或没有兴趣', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'phq9_2', text: '感到心情低落、沮丧或绝望', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'phq9_3', text: '入睡困难、睡不安稳或睡眠过多', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'phq9_4', text: '感觉疲倦或没有活力', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'phq9_5', text: '食欲不振或吃太多', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'phq9_6', text: '觉得自己很糟——或觉得自己很失败，或让自己或家人失望', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'phq9_7', text: '对事物专注有困难，例如阅读报纸或看电视时', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'phq9_8', text: '动作或说话速度缓慢到别人已经察觉？或刚好相反——烦躁或坐立不安、动来动去的情况更胜于平常', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'phq9_9', text: '有不如死掉或用某种方式伤害自己的念头', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
];

export function interpretPHQ9(totalScore: number): { severity: string; clinicalCutoff: boolean; recommendation: string } {
  if (totalScore <= 4) return { severity: 'minimal', clinicalCutoff: false, recommendation: '抑郁症状轻微，建议持续自我监测。' };
  if (totalScore <= 9) return { severity: 'mild', clinicalCutoff: false, recommendation: '轻度抑郁，建议关注情绪变化，考虑心理咨询。' };
  if (totalScore <= 14) return { severity: 'moderate', clinicalCutoff: true, recommendation: '中度抑郁，建议寻求专业心理咨询。' };
  if (totalScore <= 19) return { severity: 'moderately_severe', clinicalCutoff: true, recommendation: '中重度抑郁，强烈建议寻求专业心理治疗，必要时考虑精神科评估。' };
  return { severity: 'severe', clinicalCutoff: true, recommendation: '重度抑郁，请尽快寻求专业精神科帮助。' };
}

// ============================================================
// GAD-7 焦虑量表
// ============================================================

export const GAD7_QUESTIONS = [
  { id: 'gad7_1', text: '感觉紧张，焦虑或急切', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'gad7_2', text: '不能停止或控制担忧', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'gad7_3', text: '对各种事情担忧过多', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'gad7_4', text: '很难放松下来', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'gad7_5', text: '烦躁不安，坐立不宁', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'gad7_6', text: '变得容易烦恼或易怒', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
  { id: 'gad7_7', text: '感到好像有可怕的事要发生', scoreLabels: ['完全没有', '几天', '一半以上天数', '几乎每天'] },
];

export function interpretGAD7(totalScore: number): { severity: string; clinicalCutoff: boolean; recommendation: string } {
  if (totalScore <= 4) return { severity: 'minimal', clinicalCutoff: false, recommendation: '焦虑症状轻微，建议持续自我监测。' };
  if (totalScore <= 9) return { severity: 'mild', clinicalCutoff: false, recommendation: '轻度焦虑，建议关注情绪变化，考虑心理咨询。' };
  if (totalScore <= 14) return { severity: 'moderate', clinicalCutoff: true, recommendation: '中度焦虑，建议寻求专业心理咨询。' };
  return { severity: 'severe', clinicalCutoff: true, recommendation: '重度焦虑，强烈建议寻求专业心理治疗。' };
}

// ============================================================
// 量表评分的 AI Prompt
// ============================================================

export const ASSESSMENT_SCORING_PROMPT = `你是一位心理评估专家。根据来访者的量表回答，生成评估报告。

输出格式（JSON）：
{
  "totalScore": number,
  "severity": "minimal" | "mild" | "moderate" | "moderately_severe" | "severe",
  "clinicalCutoff": boolean,
  "interpretation": "string",
  "recommendation": "string",
  "riskFlags": string[]
}

要求：
- 只输出纯 JSON
- interpretation 用温暖、专业的中文
- 如果量表包含自杀意念题目且得分 > 0，riskFlags 包含 "suicidal_ideation"
- recommendation 要具体、可操作`;

// ============================================================
// Session 后评估 Prompt
// ============================================================

export const SESSION_OUTCOME_PROMPT = `根据以下治疗会话记录，写一段 session 摘要。

要求：
- 3-5 句话
- 捕捉核心情绪、关键发现、来访者展现的模式
- 语言温暖、专业、准确
- 包含本次使用的干预技术
- 指出任何值得关注的进展或风险信号`;
