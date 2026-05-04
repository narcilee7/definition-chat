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

// Agents
export const api = {
  agents: {
    list: () => fetchJson<any[]>("/api/agents"),
    get: (id: string) => fetchJson<any>(`/api/agents/${id}`),
    create: (data: unknown) =>
      fetchJson<any>("/api/agents", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchJson<any>(`/api/agents/${id}`, { method: "DELETE" }),
  },

  sessions: {
    list: () => fetchJson<any[]>("/api/sessions"),
    get: (id: string) => fetchJson<any>(`/api/sessions/${id}`),
    create: (data: { mode: string; agentIds: string[]; title?: string }) =>
      fetchJson<any>("/api/sessions", { method: "POST", body: JSON.stringify(data) }),
  },

  chat: {
    send: (data: { sessionId: string; agentId: string; content: string }) =>
      fetchJson<any>("/api/chat", { method: "POST", body: JSON.stringify(data) }),
    multi: (data: { sessionId: string; agentIds: string[]; content: string }) =>
      fetchJson<any>("/api/chat/multi", { method: "POST", body: JSON.stringify(data) }),
    stream: (data: { sessionId: string; agentId: string; content: string }) => {
      return fetch(`${API_BASE}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
  },

  builder: {
    chat: (data: { sessionId: string; content: string }) =>
      fetchJson<any>("/api/builder/chat", { method: "POST", body: JSON.stringify(data) }),
    confirm: (data: unknown) =>
      fetchJson<any>("/api/builder/confirm", { method: "POST", body: JSON.stringify(data) }),
  },
};
