import { EventEmitter } from "events";

export interface AgentEvent {
  id: string;
  planId: string;
  taskId: string;
  type: "step" | "session_ready" | "error" | "completed" | "failed";
  data: unknown;
  sequenceNum: number;
}

export const agentEventEmitter = new EventEmitter();
agentEventEmitter.setMaxListeners(100);

export function emitAgentEvent(event: AgentEvent) {
  agentEventEmitter.emit("agentEvent", event);
}
