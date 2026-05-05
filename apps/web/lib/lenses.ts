export interface LensOption {
  id: string;
  name: string;
  shortDescription: string;
  color: string;
  bg: string;
  domains: string[];
  sees: string[];
  ignores?: string[];
  explainsPainAs?: string;
  coreQuestions?: string[];
  explorationMoves?: string[];
  risks?: string[];
  isCustom?: boolean;
}

export const LENS_OPTIONS: LensOption[] = [
  {
    id: "cognitive-judgment",
    name: "认知判断 Lens",
    shortDescription: "检查看似确定的判断，哪些其实只是未经验证的解释。",
    color: "bg-blue-500",
    bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    domains: ["自动判断", "证据检验", "情绪推理"],
    sees: ["灾难化", "全或无思维", "把感受当事实"],
  },
  {
    id: "relationship-pattern",
    name: "关系模式 Lens",
    shortDescription: "看见亲密、回避、讨好、控制背后的重复关系脚本。",
    color: "bg-rose-500",
    bg: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    domains: ["亲密关系", "依恋", "旧模式"],
    sees: ["预先撤退", "被抛弃感", "负担感"],
  },
  {
    id: "shame",
    name: "羞耻 Lens",
    shortDescription: "识别那些把事件变成“我这个人有问题”的深层叙事。",
    color: "bg-amber-500",
    bg: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    domains: ["不配得感", "自我否定", "暴露恐惧"],
    sees: ["自我审判", "被看穿恐惧", "不值得"],
  },
  {
    id: "values",
    name: "价值 Lens",
    shortDescription: "把痛苦理解为生活正在偏离真正重要之物的信号。",
    color: "bg-emerald-500",
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    domains: ["意义", "选择", "承诺行动"],
    sees: ["价值背离", "过度适应", "行动断裂"],
  },
  {
    id: "body-signal",
    name: "身体信号 Lens",
    shortDescription: "把疲惫、紧张、失眠看作身体还没被语言表达的内容。",
    color: "bg-cyan-500",
    bg: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    domains: ["身体感受", "边界", "压力反应"],
    sees: ["躯体化", "长期压抑", "身体边界"],
  },
  {
    id: "social-context",
    name: "社会处境 Lens",
    shortDescription: "把个人困扰放回职业、家庭、时代和结构压力中理解。",
    color: "bg-violet-500",
    bg: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    domains: ["职业压力", "社会比较", "结构处境"],
    sees: ["绩效逻辑", "阶层压力", "时代焦虑"],
  },
];

export function findLens(id: string): LensOption | undefined {
  return getAllLensOptions().find((lens) => lens.id === id);
}

const CUSTOM_LENSES_KEY = "ohme:custom-lenses:v1";

export type CustomLensInput = Pick<
  LensOption,
  "name" | "shortDescription" | "domains" | "sees" | "ignores" | "explainsPainAs" | "coreQuestions" | "explorationMoves" | "risks"
>;

export function readCustomLenses(): LensOption[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(CUSTOM_LENSES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomLens(input: CustomLensInput): LensOption {
  const nextLens: LensOption = {
    ...input,
    id: `custom-${Date.now()}`,
    color: "bg-fuchsia-500",
    bg: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    domains: input.domains,
    sees: input.sees,
    ignores: input.ignores || [],
    coreQuestions: input.coreQuestions || [],
    explorationMoves: input.explorationMoves || [],
    risks: input.risks || [],
    isCustom: true,
  };

  const lenses = readCustomLenses();
  window.localStorage.setItem(CUSTOM_LENSES_KEY, JSON.stringify([nextLens, ...lenses]));
  return nextLens;
}

export function forkLens(lens: LensOption): LensOption {
  return saveCustomLens({
    name: `${lens.name.replace(/\s*Lens$/, "")} Fork Lens`,
    shortDescription: lens.shortDescription,
    domains: lens.domains,
    sees: lens.sees,
    ignores: lens.ignores || [],
    explainsPainAs: lens.explainsPainAs || lens.shortDescription,
    coreQuestions: lens.coreQuestions || [],
    explorationMoves: lens.explorationMoves || [],
    risks: lens.risks || [],
  });
}

export function deleteCustomLens(id: string): void {
  const lenses = readCustomLenses().filter((lens) => lens.id !== id);
  window.localStorage.setItem(CUSTOM_LENSES_KEY, JSON.stringify(lenses));
}

export function getAllLensOptions(): LensOption[] {
  return [...LENS_OPTIONS, ...readCustomLenses()];
}

export function getCustomLensPayload(ids: string[]) {
  return readCustomLenses()
    .filter((lens) => ids.includes(lens.id))
    .map((lens) => ({
      id: lens.id,
      name: lens.name,
      shortDescription: lens.shortDescription,
      sees: lens.sees,
      ignores: lens.ignores || [],
      explainsPainAs: lens.explainsPainAs || lens.shortDescription,
      coreQuestions: lens.coreQuestions || [],
      explorationMoves: lens.explorationMoves || [],
      risks: lens.risks || [],
    }));
}

export function encodeLensFork(lens: LensOption): string {
  return encodeURIComponent(
    JSON.stringify({
      name: `${lens.name.replace(/\s*Lens$/, "")} Fork Lens`,
      shortDescription: lens.shortDescription,
      domains: lens.domains,
      sees: lens.sees,
      ignores: lens.ignores || [],
      explainsPainAs: lens.explainsPainAs || lens.shortDescription,
      coreQuestions: lens.coreQuestions || [],
      explorationMoves: lens.explorationMoves || [],
      risks: lens.risks || [],
    }),
  );
}
