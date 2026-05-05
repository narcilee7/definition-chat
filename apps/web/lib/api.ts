const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  sessions: {
    list: () => fetchJson<any[]>("/api/sessions"),
    get: (id: string) => fetchJson<any>(`/api/sessions/${id}`),
    addMessage: (id: string, data: { role: string; content: string }) =>
      fetchJson<any>(`/api/sessions/${id}/messages`, { method: "POST", body: JSON.stringify(data) }),
  },

  therapy: {
    createSession: (data: { userId: string; therapistId: string; presentingProblem?: string }) =>
      fetchJson<any>("/api/therapy/sessions", { method: "POST", body: JSON.stringify(data) }),
    getSession: (id: string) => fetchJson<any>(`/api/therapy/sessions/${id}`),
    chat: (data: { sessionId: string; content: string }) =>
      fetchJson<any>("/api/therapy/chat", { method: "POST", body: JSON.stringify(data) }),
    stream: (data: { sessionId: string; content: string }) => {
      return fetch(`${API_BASE}/api/therapy/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    setPhase: (id: string, phase: string) =>
      fetchJson<any>(`/api/therapy/sessions/${id}/phase`, { method: "POST", body: JSON.stringify({ phase }) }),
  },

  personas: {
    list: () => fetchJson<any[]>("/api/agents"),
    get: (id: string) => fetchJson<any>(`/api/agents/${id}`),
  },

  assessments: {
    list: () => fetchJson<any[]>("/api/assessments"),
    questions: (type: string) => fetchJson<any>(`/api/assessments/questions/${type}`),
    submit: (data: any) => fetchJson<any>("/api/assessments", { method: "POST", body: JSON.stringify(data) }),
    trend: (type: string, userId?: string) => fetchJson<any>(`/api/assessments/trend?type=${type}&userId=${userId || "default"}`),
    latest: (type: string, userId?: string) => fetchJson<any>(`/api/assessments/${type}/latest?userId=${userId || "default"}`),
  },

  safety: {
    get: (userId: string) => fetchJson<any>(`/api/safety-plans/${userId}`),
    save: (userId: string, data: any) =>
      fetchJson<any>(`/api/safety-plans/${userId}`, { method: "POST", body: JSON.stringify(data) }),
  },
  refraction: {
    analyze: (data: { userId: string; question: string; lensIds?: string[]; approachIds?: string[] }) =>
      fetchJson<any>("/api/refraction", { method: "POST", body: JSON.stringify(data) }),
  },
  builder: {
    chat: (data: { sessionId: string; content: string }) =>
      fetchJson<any>("/api/builder/chat", { method: "POST", body: JSON.stringify(data) }),
    confirm: (data: unknown) =>
      fetchJson<any>("/api/builder/confirm", { method: "POST", body: JSON.stringify(data) }),
  },
};
