import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Agent {
  id: string;
  name: string;
  role: string;
  tone: string;
  color: string;
  description: string;
  isBuiltIn: boolean;
}

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: api.agents.list,
  });
}
