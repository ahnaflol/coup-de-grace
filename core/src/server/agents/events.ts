import { EventEmitter } from "events";
import type { AgentEventType } from "@/types";

export interface AgentEvent {
  id: string;
  planId: string;
  taskId: string;
  type: AgentEventType;
  data: unknown;
  sequenceNum: number;
}

export const agentEventEmitter = new EventEmitter();
agentEventEmitter.setMaxListeners(100);

export function emitAgentEvent(event: AgentEvent) {
  agentEventEmitter.emit("agentEvent", event);
}
