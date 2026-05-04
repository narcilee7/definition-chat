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

export function useSessions() {
  return useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: api.sessions.list,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["sessions", id],
    queryFn: () => api.sessions.get(id),
    enabled: !!id && id !== "new",
  });
}
