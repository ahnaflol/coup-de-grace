import { Stagehand, AISdkClient } from "@browserbasehq/stagehand";
import { createMistral } from "@ai-sdk/mistral";
import Browserbase from "@browserbasehq/sdk";
import { db } from "../db";
import { tasks, agentEvents } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { emitAgentEvent } from "./events";

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
    const mistralClient = new AISdkClient({
      model: createMistral({ apiKey: process.env.MISTRAL_API_KEY! })(
        "mistral-large-latest",
      ),
    });
    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      llmClient: mistralClient,
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
    console.log(
      `[runner] Creating agent with model mistral-large-latest`,
    );
    const agent = stagehand.agent();

    console.log(`[runner] Executing agent | maxSteps=25`);
    const result = await agent.execute({
      instruction,
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
      console.log(`[runner] Closing Stagehand | taskId=${taskId}`);
      await stagehand.close().catch(() => {});
    }
  }
}
