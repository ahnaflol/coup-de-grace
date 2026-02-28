import { Stagehand } from "@browserbasehq/stagehand";
import Browserbase from "@browserbasehq/sdk";
import { db } from "../db";
import { tasks, agentEvents } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { emitAgentEvent } from "./events";

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

export async function runAgent(
  planId: string,
  taskId: string,
  instruction: string,
) {
  let sequenceNum = 0;
  let stagehand: Stagehand | null = null;

  console.log(`[runner] Starting agent | planId=${planId} taskId=${taskId}`);
  console.log(`[runner] Instruction: ${instruction}`);

  try {
    // Mark task as running
    await db
      .update(tasks)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(tasks.id, taskId));
    console.log(`[runner] Task marked as running | taskId=${taskId}`);

    // Init Stagehand with Browserbase
    console.log(`[runner] Initializing Stagehand with Browserbase`);

    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      // model: "mistral/codestral-2508",
      model: "openai/gpt-5",
    });
    await stagehand.init();
    console.log(`[runner] Stagehand initialized`);

    // Fetch embeddable Live View URL from Browserbase
    const bbSessionId = stagehand.browserbaseSessionID;
    console.log(`[runner] Browserbase session ID: ${bbSessionId}`);
    let liveViewUrl: string | undefined;

    if (bbSessionId) {
      const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
      const debugInfo = await bb.sessions.debug(bbSessionId);
      liveViewUrl = debugInfo.debuggerFullscreenUrl ?? undefined;
      console.log(`[runner] Live view URL: ${liveViewUrl}`);

      await db
        .update(tasks)
        .set({
          browserbaseSessionId: bbSessionId,
          liveViewUrl: liveViewUrl ?? null,
        })
        .where(eq(tasks.id, taskId));
    }

    // Emit session_ready event with live view URL
    await persistAndEmitEvent({
      planId,
      taskId,
      type: "session_ready",
      data: {
        browserbaseSessionId: bbSessionId ?? null,
        liveViewUrl: liveViewUrl ?? null,
      },
      sequenceNum: sequenceNum++,
    });

    // Create and execute agent
    console.log(`[runner] Creating agent with model mistral-large-latest`);
    const agent = stagehand.agent();

    console.log(`[runner] Executing agent | maxSteps=25`);
    const result = await agent.execute({
      instruction,
      highlightCursor: true,
      maxSteps: 25,
    });
    console.log(`[runner] Agent execution complete | taskId=${taskId}`, result);

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
    if (stagehand) {
      console.log(`[runner] Closing Stagehand | taskId=${taskId}`);
      await stagehand.close().catch(() => {});
    }
  }
}
