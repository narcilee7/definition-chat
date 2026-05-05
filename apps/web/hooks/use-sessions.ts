import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Session {
  id: string;
  title: string;
  intent?: string;
  mood?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function useSessions(userId?: string) {
  return useQuery<Session[]>({
    queryKey: ["sessions", userId],
    queryFn: () => api.sessions.list(userId),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["sessions", id],
    queryFn: () => api.sessions.get(id),
    enabled: !!id && id !== "new",
  });
}
