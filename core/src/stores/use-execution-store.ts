import { create } from "zustand";
import type { Agent, AgentStatus, AgentLogEntry } from "@/types";

interface ExecutionState {
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  addLogEntry: (agentId: string, entry: AgentLogEntry) => void;
  stopAgent: (id: string) => void;
  restartAgent: (id: string) => void;
  getStatusCounts: () => Record<AgentStatus, number>;
  getOverallProgress: () => number;
}

const ALL_STATUSES: AgentStatus[] = ["idle", "running", "completed", "failed"];

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  agents: [],

  setAgents: (agents) => set({ agents }),

  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id ? { ...agent, ...updates } : agent
      ),
    })),

  addLogEntry: (agentId, entry) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? { ...agent, logs: [...agent.logs, entry] }
          : agent
      ),
    })),

  stopAgent: (id) => get().updateAgent(id, { status: "failed" }),

  restartAgent: (id) =>
    get().updateAgent(id, {
      status: "running",
      progress: 0,
      logs: [],
      startedAt: new Date(),
      completedAt: null,
    }),

  getStatusCounts: () => {
    const agents = get().agents;
    return ALL_STATUSES.reduce(
      (counts, status) => {
        counts[status] = agents.filter((a) => a.status === status).length;
        return counts;
      },
      {} as Record<AgentStatus, number>
    );
  },

  getOverallProgress: () => {
    const agents = get().agents;
    if (agents.length === 0) return 0;
    return Math.round(
      agents.reduce((sum, a) => sum + a.progress, 0) / agents.length
    );
  },
}));
