export type PlanningStep = "prompt" | "chat" | "review";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}


export type TaskStatus = "pending" | "running" | "completed" | "failed";

export type AgentEventType =
  | "step"
  | "session_ready"
  | "error"
  | "completed"
  | "failed";

export interface TaskEvent {
  id: string;
  taskId: string;
  type: AgentEventType;
  data: unknown;
  sequenceNum: number;
}
