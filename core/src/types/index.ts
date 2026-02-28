export type TaskMode = "testing" | "data-migration" | "data-entry";

export type PlanningStep = "mode" | "prompt" | "chat" | "review";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  agentCount: number;
}

export interface Credentials {
  url: string;
  username: string;
  password: string;
}

export type AgentStatus = "idle" | "running" | "completed" | "failed";

export interface AgentLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  detail: string;
}

export interface Agent {
  id: string;
  name: string;
  taskDescription: string;
  status: AgentStatus;
  progress: number;
  logs: AgentLogEntry[];
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface ModeOption {
  id: TaskMode;
  title: string;
  description: string;
  icon: string;
}
