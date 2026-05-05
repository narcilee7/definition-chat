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
    list: (userId?: string) => fetchJson<any[]>(`/api/sessions${userId ? `?userId=${userId}` : ""}`),
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
    analyze: (data: { userId: string; question: string; lensIds?: string[]; approachIds?: string[]; customLenses?: unknown[] }) =>
      fetchJson<any>("/api/refraction", { method: "POST", body: JSON.stringify(data) }),
  },

  // V4: Exploration Session API
  exploration: {
    create: (data: { userId: string; lensId: string; question: string; customLens?: unknown }) =>
      fetchJson<any>("/api/exploration/sessions", { method: "POST", body: JSON.stringify(data) }),
    get: (sessionId: string) => fetchJson<any>(`/api/exploration/sessions/${sessionId}`),
    sendMessage: (sessionId: string, data: { userInput: string }) =>
      fetchJson<any>(`/api/exploration/sessions/${sessionId}/messages`, { method: "POST", body: JSON.stringify(data) }),
    save: (sessionId: string) =>
      fetchJson<any>(`/api/exploration/sessions/${sessionId}/save`, { method: "POST" }),
    listUserSessions: (userId: string) => fetchJson<any[]>(`/api/exploration/users/${userId}/sessions`),
  },

  // V4: Self Model API
  selfModel: {
    get: (userId: string) => fetchJson<any>(`/api/self-model/${userId}`),
    listEntries: (userId: string, filters?: { entryType?: string; lensId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.entryType) params.set("entryType", filters.entryType);
      if (filters?.lensId) params.set("lensId", filters.lensId);
      return fetchJson<any[]>(`/api/self-model/${userId}/entries?${params.toString()}`);
    },
    getEntry: (entryId: string) => fetchJson<any>(`/api/self-model/entries/${entryId}`),
    updateEntry: (entryId: string, data: { newNarrative?: string; tags?: string[]; userEdited?: boolean }) =>
      fetchJson<any>(`/api/self-model/entries/${entryId}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteEntry: (entryId: string) =>
      fetchJson<any>(`/api/self-model/entries/${entryId}`, { method: "DELETE" }),
    listExperiments: (userId: string, status?: string) =>
      fetchJson<any[]>(`/api/self-model/${userId}/experiments${status ? `?status=${status}` : ""}`),
    createExperiment: (userId: string, data: { description: string; sourceLensId: string; sourceLensName?: string }) =>
      fetchJson<any>(`/api/self-model/${userId}/experiments`, { method: "POST", body: JSON.stringify(data) }),
    updateExperiment: (experimentId: string, data: { status?: string; reflection?: string }) =>
      fetchJson<any>(`/api/self-model/experiments/${experimentId}`, { method: "PATCH", body: JSON.stringify(data) }),
    insights: (userId: string) => fetchJson<any[]>(`/api/self-model/${userId}/insights`),
  },

  // V4: Lens Market API
  lenses: {
    list: (params?: { visibility?: string; authorId?: string; query?: string; sortBy?: string; limit?: number; offset?: number }) => {
      const search = new URLSearchParams();
      if (params?.visibility) search.set("visibility", params.visibility);
      if (params?.authorId) search.set("authorId", params.authorId);
      if (params?.query) search.set("query", params.query);
      if (params?.sortBy) search.set("sortBy", params.sortBy);
      if (params?.limit) search.set("limit", String(params.limit));
      if (params?.offset) search.set("offset", String(params.offset));
      return fetchJson<any>(`/api/lenses?${search.toString()}`);
    },
    get: (id: string) => fetchJson<any>(`/api/lenses/${id}`),
    create: (data: any) => fetchJson<any>("/api/lenses", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchJson<any>(`/api/lenses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string, userId: string) => fetchJson<any>(`/api/lenses/${id}`, { method: "DELETE", body: JSON.stringify({ userId }) }),
    fork: (id: string, userId: string, userName?: string) =>
      fetchJson<any>(`/api/lenses/${id}/fork`, { method: "POST", body: JSON.stringify({ userId, userName }) }),
  },

  builder: {
    chat: (data: { sessionId: string; content: string }) =>
      fetchJson<any>("/api/builder/chat", { method: "POST", body: JSON.stringify(data) }),
    confirm: (data: unknown) =>
      fetchJson<any>("/api/builder/confirm", { method: "POST", body: JSON.stringify(data) }),
  },
};
