import Browserbase from "@browserbasehq/sdk";
import { nanoid } from "nanoid";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { agentEvents, tasks } from "../db/schema";
import { emitAgentEvent } from "./events";

export async function stopAllRunningTasks(input?: { reason?: string }) {
  const reason = input?.reason ?? "Stopped due to a new execution starting";

  const runningTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, "running"),
    columns: { id: true, browserbaseSessionId: true },
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

      const errorEvent = {
        id: nanoid(),
        taskId: t.id,
        type: "error" as const,
        data: { error: reason },
        sequenceNum: sequenceNum++,
      };
      const failedEvent = {
        id: nanoid(),
        taskId: t.id,
        type: "failed" as const,
        data: { error: reason },
        sequenceNum: sequenceNum++,
      };

      await db.insert(agentEvents).values([errorEvent, failedEvent]);
      emitAgentEvent(errorEvent);
      emitAgentEvent(failedEvent);

      return true;
    })
  );

  const stopped = stopResults.filter((r) => r.status === "fulfilled" && r.value)
    .length;
  return { stopped, requestedRelease };
}
