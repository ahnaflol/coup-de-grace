import { BrowserUse } from "browser-use-sdk";
import { db } from "../db";
import { tasks, agentEvents } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { emitAgentEvent } from "./events";
import { agentResultSchema } from "@/server/schemas";

async function persistAndEmitEvent(input: {
  planId: string;
  taskId: string;
  type: "step" | "session_ready" | "error" | "completed" | "failed";
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

export async function runAgent(input: {
  planId: string;
  taskId: string;
  instruction: string;
  startUrl: string;
}) {
  const { planId, taskId, instruction, startUrl } = input;
  let sequenceNum = 0;
  let client: BrowserUse | null = null;
  let sessionId: string | null = null;

  console.log(`[runner] Starting agent | planId=${planId} taskId=${taskId}`);
  console.log(`[runner] Instruction: ${instruction}`);

  try {
    if (!process.env.BROWSER_USE_API_KEY) {
      throw new Error(
        "Missing BROWSER_USE_API_KEY. Set it to run browser-use sessions.",
      );
    }

    // Mark task as running
    await db
      .update(tasks)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(tasks.id, taskId));
    console.log(`[runner] Task marked as running | taskId=${taskId}`);

    client = new BrowserUse();

    let allowedDomains: string[] | undefined;
    try {
      allowedDomains = [new URL(startUrl).hostname];
    } catch {
      allowedDomains = undefined;
    }

    console.log(`[runner] Creating BrowserUse session`);
    const session = await client.sessions.create({ startUrl });
    sessionId = session.id;
    console.log(`[runner] BrowserUse session ID: ${sessionId}`);

    const liveUrl = session.liveUrl ?? null;
    console.log(`[runner] Live URL: ${liveUrl ?? "(none)"}`);

    const share = await client.sessions
      .createShare(sessionId)
      .catch(() => null);

    await db
      .update(tasks)
      .set({
        browserUseSessionId: sessionId,
        liveUrl,
        shareUrl: share?.shareUrl ?? null,
      })
      .where(eq(tasks.id, taskId));

    // Emit session_ready event with live view URL
    await persistAndEmitEvent({
      planId,
      taskId,
      type: "session_ready",
      data: {
        sessionId,
        liveUrl,
        shareUrl: share?.shareUrl ?? null,
      },
      sequenceNum: sequenceNum++,
    });

    console.log(`[runner] Executing BrowserUse task | maxSteps=25`);
    const run = client.run(instruction, {
      sessionId,
      schema: agentResultSchema,
      maxSteps: 25,
      startUrl,
      allowedDomains,
      highlightElements: true,
    });

    for await (const step of run) {
      console.log(`[runner] Step ${step.number}: ${step.nextGoal}`);
      console.log(`[runner]   URL: ${step.url}`);
      await persistAndEmitEvent({
        planId,
        taskId,
        type: "step",
        data: {
          number: step.number,
          nextGoal: step.nextGoal,
          url: step.url,
          screenshotUrl: step.screenshotUrl ?? null,
          actions: step.actions,
        },
        sequenceNum: sequenceNum++,
      });
    }

    const result = run.result ?? (await run);
    console.log(`[runner] Task execution complete | taskId=${taskId}`, {
      taskId: result.id,
      status: result.status,
    });

    // Mark task completed
    const [completedRow] = await db
      .update(tasks)
      .set({
        status: "completed",
        result: result,
        completedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.status, "running")))
      .returning({ id: tasks.id });

    if (!completedRow) return;
    console.log(`[runner] Task marked as completed | taskId=${taskId}`);

    // Emit completed event
    await persistAndEmitEvent({
      planId,
      taskId,
      type: "completed",
      data: { result },
      sequenceNum: sequenceNum++,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(
      `[runner] Agent failed | taskId=${taskId} error=${errorMessage}`,
    );

    // Mark task failed
    const [failedRow] = await db
      .update(tasks)
      .set({
        status: "failed",
        result: { error: errorMessage },
        completedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.status, "running")))
      .returning({ id: tasks.id });

    if (!failedRow) return;

    // Emit error + failed events
    await persistAndEmitEvent({
      planId,
      taskId,
      type: "error",
      data: { error: errorMessage },
      sequenceNum: sequenceNum++,
    });
    await persistAndEmitEvent({
      planId,
      taskId,
      type: "failed",
      data: { error: errorMessage },
      sequenceNum: sequenceNum++,
    });
  } finally {
    if (client && sessionId) {
      console.log(`[runner] Stopping BrowserUse session | taskId=${taskId}`);
      await client.sessions.stop(sessionId).catch(() => {});
    }
  }
}
