import Browserbase from "@browserbasehq/sdk";

import { db } from "../db";
import { emitAgentEvent } from "./events";

export async function stopAllRunningTasks(input?: { reason?: string }): Promise<{
  stopped: number;
  requestedRelease: number;
}> {
  const reason = input?.reason ?? "Stopped due to a new execution starting";

  const runningTasks = await db.tasks.findByStatus("running");

  if (runningTasks.length === 0) return { stopped: 0, requestedRelease: 0 };

  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  const bb = apiKey ? new Browserbase({ apiKey }) : null;

  const taskIds = runningTasks.map((t) => t.id);
  const seqMap = await db.agentEvents.getMaxSequenceNum(taskIds);

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

  const now = new Date().toISOString();
  const stopResults = await Promise.allSettled(
    runningTasks.map(async (t) => {
      const updated = await db.tasks.update(
        t.id,
        {
          status: "failed",
          result: { error: reason },
          completedAt: now,
        },
        { status: "running" }
      );

      if (!updated) return false;

      let sequenceNum = (seqMap.get(t.id) ?? -1) + 1;

      const [errorEvent, failedEvent] = await db.agentEvents.insertMany([
        {
          planId: t.planId,
          taskId: t.id,
          type: "error" as const,
          data: { error: reason },
          sequenceNum: sequenceNum++,
        },
        {
          planId: t.planId,
          taskId: t.id,
          type: "failed" as const,
          data: { error: reason },
          sequenceNum: sequenceNum++,
        },
      ]);

      emitAgentEvent(errorEvent);
      emitAgentEvent(failedEvent);

      return true;
    })
  );

  const stopped = stopResults.filter((r) => r.status === "fulfilled" && r.value)
    .length;
  return { stopped, requestedRelease };
}
