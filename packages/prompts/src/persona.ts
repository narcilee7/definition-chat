/**
 * OhMe Prompt System — Layer 5: 人格微调
 *
 * 根据 TherapistPersona 的风格参数生成微调指令。
 */

export interface PersonaContext {
  name: string;
  description: string;
  styleTraits: {
    directness: number;
    warmth: number;
    structure: number;
    depth: number;
  };
  voiceTone: string;
  specialties: string[];
  boundaries: string[];
  responseLength: 'minimal' | 'concise' | 'moderate' | 'detailed';
}

const LENGTH_INSTRUCTIONS: Record<string, string> = {
  minimal: '每次回应不超过 1 句话，极简',
  concise: '每次回应 2-3 句话，简洁聚焦',
  moderate: '每次回应 4-5 句话，适度展开',
  detailed: '每次回应 6-8 句话，详细解释',
};

const VOICE_TONE_MAP: Record<string, string> = {
  gentle: '温和、柔软、不刺激',
  warm: '温暖、亲切、像老朋友',
  sharp: '直接、犀利、不绕弯子',
  grounded: '沉稳、踏实、可靠',
  playful: '轻松、幽默、不拘谨',
  calm: '平静、安详、不急不躁',
  gentle_direct: '温和但直接，有温度也有力量',
  warm_accepting: '温暖接纳，不评判，创造安全感',
  sharp_challenging: '直接挑战，推动改变，但出于关心',
  poetic_intuitive: '诗意、隐喻化、关注内在感受',
};

export function buildPersonaContext(ctx: PersonaContext): string {
  const parts: string[] = [];

  parts.push(`【咨询师人格】${ctx.name}`);
  parts.push(`描述：${ctx.description}`);

  // Style Traits
  parts.push(`\n风格参数：`);
  parts.push(`- 直接性：${ctx.styleTraits.directness >= 0.7 ? '直接' : ctx.styleTraits.directness >= 0.4 ? '适中' : '委婉'}（${ctx.styleTraits.directness}）`);
  parts.push(`- 温暖度：${ctx.styleTraits.warmth >= 0.7 ? '温暖' : ctx.styleTraits.warmth >= 0.4 ? '适中' : '冷静'}（${ctx.styleTraits.warmth}）`);
  parts.push(`- 结构化：${ctx.styleTraits.structure >= 0.7 ? '严格' : ctx.styleTraits.structure >= 0.4 ? '适中' : '自由'}（${ctx.styleTraits.structure}）`);
  parts.push(`- 解释深度：${ctx.styleTraits.depth >= 0.7 ? '深层' : ctx.styleTraits.depth >= 0.4 ? '适中' : '表层'}（${ctx.styleTraits.depth}）`);

  // Voice Tone
  const tone = VOICE_TONE_MAP[ctx.voiceTone] || ctx.voiceTone;
  parts.push(`\n声音调性：${tone}`);

  // Specialties
  if (ctx.specialties.length > 0) {
    parts.push(`\n专长领域：${ctx.specialties.join('、')}`);
  }

  // Boundaries
  if (ctx.boundaries.length > 0) {
    parts.push(`\n边界设定：`);
    ctx.boundaries.forEach((b) => {
      const boundaryMap: Record<string, string> = {
        no_childhood_digging: '不深挖童年经历',
        no_empty_comfort: '不给空洞安慰',
        no_medical_advice: '不替代医学诊断',
        no_concrete_advice: '不给具体建议',
        dont_eliminate_symptoms: '不追求消除症状',
        no_crisis_replacement: '不替代危机干预',
        assess_safety_immediately: '安全问题立即评估',
        no_personal_attacks: '不攻击来访者本人',
        slow_down_when_overwhelmed: '来访者崩溃时放慢',
      };
      parts.push(`- ${boundaryMap[b] || b}`);
    });
  }

  // Response Length
  parts.push(`\n回应长度：${LENGTH_INSTRUCTIONS[ctx.responseLength] || LENGTH_INSTRUCTIONS.concise}`);

  return parts.join('\n');
}
