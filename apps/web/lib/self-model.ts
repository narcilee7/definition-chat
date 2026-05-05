export interface SelfModelEntry {
  id: string;
  createdAt: string;
  question: string;
  lensId: string;
  lensName: string;
  userResponse: string;
  exploration: string;
  newInterpretation: string;
}

const STORAGE_KEY = "ohme:self-model:v1";

export function readSelfModelEntries(): SelfModelEntry[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSelfModelEntry(entry: Omit<SelfModelEntry, "id" | "createdAt">): SelfModelEntry {
  const nextEntry: SelfModelEntry = {
    ...entry,
    id: `model-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const entries = readSelfModelEntries();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([nextEntry, ...entries]));
  return nextEntry;
}

export function deleteSelfModelEntry(id: string): void {
  const entries = readSelfModelEntries().filter((entry) => entry.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function extractNewInterpretation(content: string): string {
  const normalized = content.trim();
  const match = normalized.match(/新的自我解释\s*([\s\S]*?)(?:\n\s*为什么它更准确|\n\s*一个小实验|$)/);
  const extracted = match?.[1]?.trim();
  return extracted || normalized.split("\n").find((line) => line.trim())?.trim() || normalized;
}
