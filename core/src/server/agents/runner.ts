import { Stagehand } from "@browserbasehq/stagehand";
import Browserbase from "@browserbasehq/sdk";
import { db } from "../db";
import { tasks, agentEvents } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { emitAgentEvent } from "./events";

export async function runAgent(planId: string, taskId: string, instruction: string) {
  let sequenceNum = 0;
  let stagehand: Stagehand | null = null;

  try {
    // Mark task as running
    await db
      .update(tasks)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(tasks.id, taskId));

    // Init Stagehand with Browserbase
    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
    });
    await stagehand.init();

    // Fetch embeddable Live View URL from Browserbase
    const bbSessionId = stagehand.browserbaseSessionID;
    let liveViewUrl: string | undefined;

    if (bbSessionId) {
      const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
      const debugInfo = await bb.sessions.debug(bbSessionId);
      liveViewUrl = debugInfo.debuggerFullscreenUrl ?? undefined;

      await db
        .update(tasks)
        .set({ browserbaseSessionId: bbSessionId, liveViewUrl: liveViewUrl ?? null })
        .where(eq(tasks.id, taskId));
    }

    // Emit session_ready event with live view URL
    const [readyEvent] = await db
      .insert(agentEvents)
      .values({
        planId,
        taskId,
        type: "session_ready",
        data: {
          browserbaseSessionId: bbSessionId ?? null,
          liveViewUrl: liveViewUrl ?? null,
        },
        sequenceNum: sequenceNum++,
      })
      .returning({
        id: agentEvents.id,
        planId: agentEvents.planId,
        taskId: agentEvents.taskId,
        data: agentEvents.data,
        sequenceNum: agentEvents.sequenceNum,
      });
    emitAgentEvent({
      id: readyEvent.id,
      planId: readyEvent.planId,
      taskId: readyEvent.taskId,
      type: "session_ready",
      data: readyEvent.data,
      sequenceNum: readyEvent.sequenceNum,
    });

    // Create and execute agent
    const agent = stagehand.agent({
      model: "mistral/mistral-large-latest",
    });

    const result = await agent.execute({
      instruction,
      maxSteps: 25,
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

    // Emit completed event
    const [completedEvent] = await db
      .insert(agentEvents)
      .values({
        planId,
        taskId,
        type: "completed",
        data: { result },
        sequenceNum: sequenceNum++,
      })
      .returning({
        id: agentEvents.id,
        planId: agentEvents.planId,
        taskId: agentEvents.taskId,
        data: agentEvents.data,
        sequenceNum: agentEvents.sequenceNum,
      });
    emitAgentEvent({
      id: completedEvent.id,
      planId: completedEvent.planId,
      taskId: completedEvent.taskId,
      type: "completed",
      data: completedEvent.data,
      sequenceNum: completedEvent.sequenceNum,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

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
    const [errorEvent] = await db
      .insert(agentEvents)
      .values({
        planId,
        taskId,
        type: "error",
        data: { error: errorMessage },
        sequenceNum: sequenceNum++,
      })
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

    const [failedEvent] = await db
      .insert(agentEvents)
      .values({
        planId,
        taskId,
        type: "failed",
        data: { error: errorMessage },
        sequenceNum: sequenceNum++,
      })
      .returning({
        id: agentEvents.id,
        planId: agentEvents.planId,
        taskId: agentEvents.taskId,
        data: agentEvents.data,
        sequenceNum: agentEvents.sequenceNum,
      });
    emitAgentEvent({
      id: failedEvent.id,
      planId: failedEvent.planId,
      taskId: failedEvent.taskId,
      type: "failed",
      data: failedEvent.data,
      sequenceNum: failedEvent.sequenceNum,
    });
  } finally {
    if (stagehand) {
      await stagehand.close().catch(() => {});
    }
  }
}
