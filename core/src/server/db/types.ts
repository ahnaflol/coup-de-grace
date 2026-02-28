export type PlanStatus = "draft" | "approved" | "executing" | "completed" | "failed";
export type TaskStatus = "pending" | "running" | "completed" | "failed";
export type AgentEventType = "step" | "session_ready" | "error" | "completed" | "failed";

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  sessionId: string;
  userPrompt: string;
  content: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  planId: string;
  title: string;
  instruction: string;
  status: TaskStatus;
  result: unknown;
  browserbaseSessionId: string | null;
  liveViewUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface AgentEvent {
  id: string;
  planId: string;
  taskId: string;
  type: AgentEventType;
  data: unknown;
  sequenceNum: number;
  createdAt: string;
}

export interface SessionWithPlans extends Session {
  plans: Plan[];
}

export interface PlanWithTasks extends Plan {
  tasks: Task[];
}
