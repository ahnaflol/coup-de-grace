import { db } from "../db";
import { agentEvents } from "../db/schema";
import { emitAgentEvent } from "./events";
import type { AgentEventType } from "@/types";

export async function persistAndEmitEvent(input: {
  planId: string;
  taskId: string;
  type: AgentEventType;
  data: unknown;
  sequenceNum: number;
}) {
  const { planId, taskId, type, data, sequenceNum } = input;

  const [row] = await db
    .insert(agentEvents)
    .values({ taskId, type, data, sequenceNum })
    .returning({
      id: agentEvents.id,
      taskId: agentEvents.taskId,
      data: agentEvents.data,
      sequenceNum: agentEvents.sequenceNum,
    });

  if (!row) return;
  emitAgentEvent({
    id: row.id,
    planId,
    taskId: row.taskId,
    type,
    data: row.data,
    sequenceNum: row.sequenceNum,
  });
}
