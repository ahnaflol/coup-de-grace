import { Stagehand } from "@browserbasehq/stagehand";
import Browserbase from "@browserbasehq/sdk";
import { db } from "../db";
import { tasks, agentEvents } from "../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { emitAgentEvent } from "./events";

export async function runAgent(taskId: string, instruction: string) {
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
      liveViewUrl = debugInfo.debuggerFullscreenUrl;

      await db
        .update(tasks)
        .set({ browserbaseSessionId: bbSessionId, liveViewUrl })
        .where(eq(tasks.id, taskId));
    }

    // Emit session_ready event with live view URL
    const readyEvent = {
      id: nanoid(),
      taskId,
      type: "session_ready" as const,
      data: {
        browserbaseSessionId: bbSessionId,
        liveViewUrl,
      },
      sequenceNum: sequenceNum++,
    };
    await db.insert(agentEvents).values(readyEvent);
    emitAgentEvent(readyEvent);

    // Create and execute agent
    const agent = stagehand.agent({
      model: "mistral/mistral-large-latest",
    });

    const result = await agent.execute({
      instruction,
      maxSteps: 25,
    });

    // Mark task completed
    await db
      .update(tasks)
      .set({
        status: "completed",
        result: result,
        completedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    // Emit completed event
    const completedEvent = {
      id: nanoid(),
      taskId,
      type: "completed" as const,
      data: { result },
      sequenceNum: sequenceNum++,
    };
    await db.insert(agentEvents).values(completedEvent);
    emitAgentEvent(completedEvent);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Mark task failed
    await db
      .update(tasks)
      .set({
        status: "failed",
        result: { error: errorMessage },
        completedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    // Emit error + failed events
    const errorEvent = {
      id: nanoid(),
      taskId,
      type: "error" as const,
      data: { error: errorMessage },
      sequenceNum: sequenceNum++,
    };
    await db.insert(agentEvents).values(errorEvent);
    emitAgentEvent(errorEvent);

    const failedEvent = {
      id: nanoid(),
      taskId,
      type: "failed" as const,
      data: { error: errorMessage },
      sequenceNum: sequenceNum++,
    };
    await db.insert(agentEvents).values(failedEvent);
    emitAgentEvent(failedEvent);
  } finally {
    if (stagehand) {
      await stagehand.close().catch(() => {});
    }
  }
}
