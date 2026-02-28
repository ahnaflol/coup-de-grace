import Browserbase from "@browserbasehq/sdk";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { agentEvents, tasks } from "../db/schema";
import { emitAgentEvent } from "./events";

export async function stopAllRunningTasks(input?: { reason?: string }) {
  const reason = input?.reason ?? "Stopped due to a new execution starting";

  const runningTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, "running"),
    columns: { id: true, planId: true, browserbaseSessionId: true },
  });

  if (runningTasks.length === 0) return { stopped: 0, requestedRelease: 0 };

  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  const bb = apiKey ? new Browserbase({ apiKey }) : null;

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
      if (!bb || !t.browserbaseSessionId) return false;
      await bb.sessions.update(t.browserbaseSessionId, {
        status: "REQUEST_RELEASE",
        projectId,
      });
      return true;
    })
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
            planId: t.planId,
            taskId: t.id,
            type: "error",
            data: { error: reason },
            sequenceNum: sequenceNum++,
          },
          {
            planId: t.planId,
            taskId: t.id,
            type: "failed",
            data: { error: reason },
            sequenceNum: sequenceNum++,
          },
        ])
        .returning({
          id: agentEvents.id,
          planId: agentEvents.planId,
          taskId: agentEvents.taskId,
          data: agentEvents.data,
          sequenceNum: agentEvents.sequenceNum,
        });

      emitAgentEvent({
        id: errorEvent.id,
        planId: errorEvent.planId,
        taskId: errorEvent.taskId,
        type: "error",
        data: errorEvent.data,
        sequenceNum: errorEvent.sequenceNum,
      });
      emitAgentEvent({
        id: failedEvent.id,
        planId: failedEvent.planId,
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
