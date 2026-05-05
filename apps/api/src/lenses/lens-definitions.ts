export interface LensDefinition {
  id: string;
  name: string;
  shortDescription: string;
  sees: string[];
  ignores: string[];
  explainsPainAs: string;
  coreQuestions: string[];
  explorationMoves: string[];
  risks: string[];
}

export const LENSES: LensDefinition[] = [
  {
    id: 'cognitive-judgment',
    name: '认知判断 Lens',
    shortDescription: '检查看似确定的判断，哪些其实只是未经验证的解释。',
    sees: ['自动判断', '证据不足', '灾难化', '全或无思维', '情绪推理'],
    ignores: ['历史创伤', '关系权力', '身体疲惫', '社会结构压力'],
    explainsPainAs: '痛苦可能来自某些未经检验的判断被当成事实。',
    coreQuestions: ['这个判断有什么证据？', '有没有同样合理的另一种解释？', '如果这是朋友的处境，你会如何理解？'],
    explorationMoves: ['把一个绝对化判断改写成可检验假设。', '列出支持和不支持这个判断的证据。'],
    risks: ['可能把真实处境过度认知化。', '可能让用户感觉自己的痛苦被简化成想法错误。'],
  },
  {
    id: 'relationship-pattern',
    name: '关系模式 Lens',
    shortDescription: '看见亲密、回避、讨好、控制背后的重复关系脚本。',
    sees: ['依恋需求', '重复关系模式', '讨好', '回避', '控制', '被抛弃感', '负担感'],
    ignores: ['现实利益', '社会压力', '身体状态', '单次事件的偶然性'],
    explainsPainAs: '痛苦可能来自旧关系模式在当前情境中的重复。',
    coreQuestions: ['这个场景像不像你熟悉的某种关系位置？', '你在预防什么最坏的关系结果？', '你最怕别人如何看见你？'],
    explorationMoves: ['命名当前关系里的默认位置。', '区分眼前的人和过去经验里的人。'],
    risks: ['可能过度追溯过去。', '可能把现实关系复杂性简化成模式重复。'],
  },
  {
    id: 'shame',
    name: '羞耻 Lens',
    shortDescription: '识别那些把事件变成“我这个人有问题”的深层叙事。',
    sees: ['自我否定', '不配得感', '暴露恐惧', '被评价', '被看穿', '被排除'],
    ignores: ['具体行动策略', '外部资源', '客观限制', '他人的责任'],
    explainsPainAs: '痛苦可能来自“我这个人有问题”的深层叙事。',
    coreQuestions: ['你把这件事解释成了自己哪里有问题？', '如果不把它变成自我审判，它还可能是什么？', '你最不想被别人看见的是什么？'],
    explorationMoves: ['把“我有问题”改写成一个更具体的经验描述。', '分离事件、感受和自我价值。'],
    risks: ['可能让用户过早接触强烈羞耻。', '可能忽略现实伤害和外部责任。'],
  },
  {
    id: 'values',
    name: '价值 Lens',
    shortDescription: '把痛苦理解为生活正在偏离真正重要之物的信号。',
    sees: ['价值背离', '选择困难', '行动断裂', '过度适应', '意义感断裂'],
    ignores: ['短期稳定需求', '现实资源不足', '未处理的关系创伤'],
    explainsPainAs: '痛苦可能来自生活正在偏离你真正重视的东西。',
    coreQuestions: ['这件事触碰了你真正重视的什么？', '你正在为了适应牺牲什么？', '如果只往重要之物靠近一小步，那会是什么？'],
    explorationMoves: ['从困扰中提取一个被压住的价值。', '设计一个不激进但更靠近价值的小行动。'],
    risks: ['可能把现实困境浪漫化。', '可能让用户对自己提出过高行动要求。'],
  },
  {
    id: 'body-signal',
    name: '身体信号 Lens',
    shortDescription: '把疲惫、紧张、失眠看作身体还没被语言表达的内容。',
    sees: ['紧张', '疲惫', '失眠', '心悸', '身体边界', '长期压抑后的身体反应'],
    ignores: ['抽象意义', '认知证据', '社会结构解释'],
    explainsPainAs: '痛苦可能是身体在替你说出还没有被语言表达的东西。',
    coreQuestions: ['这件事在身体哪里最明显？', '身体像是在拒绝什么或保护什么？', '如果身体能说一句话，它会说什么？'],
    explorationMoves: ['用身体感受替代抽象判断来描述问题。', '识别一个需要被恢复的边界。'],
    risks: ['可能忽略需要医学评估的身体症状。', '可能让用户过度解释身体信号。'],
  },
  {
    id: 'social-context',
    name: '社会处境 Lens',
    shortDescription: '把个人困扰放回职业、家庭、时代和结构压力中理解。',
    sees: ['职业压力', '阶层', '性别', '家庭结构', '绩效逻辑', '社会比较', '时代性焦虑'],
    ignores: ['个人选择空间', '亲密关系细节', '身体信号', '认知偏差'],
    explainsPainAs: '痛苦不一定只属于个人，也可能是某种社会处境压在你身上的结果。',
    coreQuestions: ['这份痛苦有多少来自你个人，又有多少来自处境？', '你正在内化哪种外部标准？', '如果把责任还给环境一部分，会发生什么？'],
    explorationMoves: ['把个人失败叙事改写为个人与处境的互动。', '识别一个可以拒绝内化的外部标准。'],
    risks: ['可能削弱用户的行动感。', '可能把所有困扰都归因于外部结构。'],
  },
];

export function findLens(id: string): LensDefinition | undefined {
  return LENSES.find((lens) => lens.id === id);
}
