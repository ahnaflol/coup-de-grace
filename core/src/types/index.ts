export type PlanningStep = "prompt" | "thinking" | "review";

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
  | "failed"
  | "row_extracted";

export interface TaskEvent {
  id: string;
  taskId: string;
  type: AgentEventType;
  data: unknown;
  sequenceNum: number;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: "select" | "multi-select" | "toggle" | "text";
  options?: string[];
  placeholder?: string;
}

export type ThoughtAnimationVariant =
  | "typewriter"
  | "slide-blur"
  | "scale-bounce"
  | "wipe-reveal"
  | "fade-glow";

export interface ThoughtTrace {
  id: string;
  text: string;
  variant: ThoughtAnimationVariant;
}

export interface Credentials {
  url: string;
  username: string;
  password: string;
}
