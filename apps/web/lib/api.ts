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
    create: (data?: { title?: string; intent?: string; mood?: string }) =>
      fetchJson<any>("/api/sessions", { method: "POST", body: JSON.stringify(data || {}) }),
  },

  chat: {
    stream: (data: { sessionId: string; content: string }) => {
      return fetch(`${API_BASE}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
  },

  memory: {
    list: () => fetchJson<any[]>("/api/memory-notes"),
  },

  context: {
    get: () => fetchJson<any>("/api/user-context"),
  },

  builder: {
    chat: (data: { sessionId: string; content: string }) =>
      fetchJson<any>("/api/builder/chat", { method: "POST", body: JSON.stringify(data) }),
    confirm: (data: unknown) =>
      fetchJson<any>("/api/builder/confirm", { method: "POST", body: JSON.stringify(data) }),
  },
};
