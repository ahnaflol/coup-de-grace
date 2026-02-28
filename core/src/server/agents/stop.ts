import { and, eq, inArray, sql } from "drizzle-orm";
import { BrowserUse } from "browser-use-sdk";
import { db } from "../db";
import { agentEvents, tasks } from "../db/schema";
import { emitAgentEvent } from "./events";

export async function stopAllRunningTasks(input?: { reason?: string }) {
  const reason = input?.reason ?? "Stopped due to a new execution starting";

  const runningTasks = await db
    .select({
      id: tasks.id,
      planId: tasks.planId,
      browserUseSessionId: tasks.browserUseSessionId,
    })
    .from(tasks)
    .where(eq(tasks.status, "running"));

  if (runningTasks.length === 0) return { stopped: 0, requestedRelease: 0 };

  const apiKey = process.env.BROWSER_USE_API_KEY;
  const bu = apiKey ? new BrowserUse({ apiKey }) : null;

  const taskIds = runningTasks.map((t) => t.id);
  const seqRows = await db
    .select({
      taskId: agentEvents.taskId,
      maxSeq: sql<number>`max(${agentEvents.sequenceNum})`.mapWith(Number),
    })
    .from(agentEvents)
    .where(inArray(agentEvents.taskId, taskIds))
    .groupBy(agentEvents.taskId);

  const seqMap = new Map(seqRows.map((r) => [r.taskId, r.maxSeq]));

  const releaseResults = await Promise.allSettled(
    runningTasks.map(async (t) => {
      if (!bu || !t.browserUseSessionId) return false;
      await bu.sessions.stop(t.browserUseSessionId);
      return true;
    }),
  );

  const requestedRelease = releaseResults.filter(
    (r) => r.status === "fulfilled" && r.value
  ).length;

  const now = new Date();
  const stopResults = await Promise.allSettled(
    runningTasks.map(async (t) => {
      const [updated] = await db
        .update(tasks)
        .set({
          status: "failed",
          result: { error: reason },
          completedAt: now,
        })
        .where(and(eq(tasks.id, t.id), eq(tasks.status, "running")))
        .returning({ id: tasks.id });

      if (!updated) return false;

      let sequenceNum = (seqMap.get(t.id) ?? -1) + 1;

      const [errorEvent, failedEvent] = await db
        .insert(agentEvents)
        .values([
          {
            taskId: t.id,
            type: "error",
            data: { error: reason },
            sequenceNum: sequenceNum++,
          },
          {
            taskId: t.id,
            type: "failed",
            data: { error: reason },
            sequenceNum: sequenceNum++,
          },
        ])
        .returning({
          id: agentEvents.id,
          taskId: agentEvents.taskId,
          data: agentEvents.data,
          sequenceNum: agentEvents.sequenceNum,
        });

      emitAgentEvent({
        id: errorEvent.id,
        planId: t.planId,
        taskId: errorEvent.taskId,
        type: "error",
        data: errorEvent.data,
        sequenceNum: errorEvent.sequenceNum,
      });
      emitAgentEvent({
        id: failedEvent.id,
        planId: t.planId,
        taskId: failedEvent.taskId,
        type: "failed",
        data: failedEvent.data,
        sequenceNum: failedEvent.sequenceNum,
      });

      return true;
    })
  );

  const stopped = stopResults.filter((r) => r.status === "fulfilled" && r.value)
    .length;
  return { stopped, requestedRelease };
}
