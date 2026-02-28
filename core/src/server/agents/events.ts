import { EventEmitter } from "events";

import type { AgentEvent } from "../db/types";

export type { AgentEvent };

export const agentEventEmitter = new EventEmitter();
agentEventEmitter.setMaxListeners(100);

export function emitAgentEvent(event: AgentEvent): void {
  agentEventEmitter.emit("agentEvent", event);
}
