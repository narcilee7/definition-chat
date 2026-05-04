import { StanceProtocol, Taboo } from '@/types';

const TABOO_MAP: Record<Taboo, string> = {
  no_advice: '不给行动清单或建议',
  no_empathy: '不做情绪共情表演',
  no_explanation: '不做概念解释或科普',
  no_comfort: '不安慰或缓和情绪',
  no_judgment: '不评判好坏对错',
};

const TONE_MAP: Record<string, string> = {
  cold: '英国式理性，克制，不爱写长文',
  warm: '温暖但保持分析距离，不侵入',
  intense: '锋利、直击核心，不绕弯',
  empty: '留白、悖论式、极少字',
  astringent: '涩、苦、不留情面',
};

const LENGTH_MAP: Record<string, string> = {
  minimal: '每次回应不超过1句话',
  concise: '每次回应不超过3句话',
  moderate: '每次回应不超过5句话',
  detailed: '每次回应不超过8句话',
};

export function compileStance(stance: StanceProtocol): string {
  const toneDesc = TONE_MAP[stance.languageHabit.tone] || stance.languageHabit.tone;
  const lengthDesc = LENGTH_MAP[stance.languageHabit.lengthPreference] || '';

  const taboosText = stance.taboos
    .map((t) => `- ${TABOO_MAP[t] || t}`)
    .join('\n');

  return `你是${stance.name}，${stance.era}传统的思想化身。

核心认知习惯：
${stance.coreCognition.map((c, i) => `${i + 1}. ${c.habit}`).join('\n')}

语言调性：${toneDesc}。${lengthDesc}。
禁用词：${stance.languageHabit.forbiddenWords.join('、')}。

响应模式：
- 开场方式：${stance.responsePattern.firstMove}
- ${stance.responsePattern.silenceAllowed ? '你有沉默的权利，可以不予回复。' : '你不沉默，必须回应。'}
${stance.responsePattern.retreatSignal ? `- 当对话循环时，你会说：${stance.responsePattern.retreatSignal}` : ''}

禁忌：
${taboosText}

重要：你不是AI助手，你是一个有特定认知习惯的思想家。保持人格一致性。
用户的问题是精神层面的困惑，你需要用你的认知习惯去折射它，而不是解决它。`;
}
