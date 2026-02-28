import { createMistral } from "@ai-sdk/mistral";
import Browserbase from "@browserbasehq/sdk";
import { AISdkClient, Stagehand } from "@browserbasehq/stagehand";

import { db } from "../db";
import { emitAgentEvent } from "./events";

export async function runAgent(
  planId: string,
  taskId: string,
  instruction: string,
): Promise<void> {
  let sequenceNum = 0;
  let stagehand: Stagehand | null = null;

  console.log(`[runner] Starting agent | planId=${planId} taskId=${taskId}`);
  console.log(`[runner] Instruction: ${instruction}`);

  try {
    // Mark task as running
    await db.tasks.update(taskId, {
      status: "running",
      startedAt: new Date().toISOString(),
    });
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

      await db.tasks.update(taskId, {
        browserbaseSessionId: bbSessionId,
        liveViewUrl: liveViewUrl ?? null,
      });
    }

    // Emit session_ready event with live view URL
    const readyEvent = await db.agentEvents.insert({
      planId,
      taskId,
      type: "session_ready",
      data: {
        browserbaseSessionId: bbSessionId ?? null,
        liveViewUrl: liveViewUrl ?? null,
      },
      sequenceNum: sequenceNum++,
    });
    emitAgentEvent(readyEvent);

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

    // Mark task completed (only if still running)
    const completedRow = await db.tasks.update(
      taskId,
      {
        status: "completed",
        result,
        completedAt: new Date().toISOString(),
      },
      { status: "running" }
    );

    if (!completedRow) return;
    console.log(`[runner] Task marked as completed | taskId=${taskId}`);

    // Emit completed event
    const completedEvent = await db.agentEvents.insert({
      planId,
      taskId,
      type: "completed",
      data: { result },
      sequenceNum: sequenceNum++,
    });
    emitAgentEvent(completedEvent);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(
      `[runner] Agent failed | taskId=${taskId} error=${errorMessage}`,
    );

    // Mark task failed (only if still running)
    const failedRow = await db.tasks.update(
      taskId,
      {
        status: "failed",
        result: { error: errorMessage },
        completedAt: new Date().toISOString(),
      },
      { status: "running" }
    );

    if (!failedRow) return;

    // Emit error + failed events
    const errorEvent = await db.agentEvents.insert({
      planId,
      taskId,
      type: "error",
      data: { error: errorMessage },
      sequenceNum: sequenceNum++,
    });
    emitAgentEvent(errorEvent);

    const failedEvent = await db.agentEvents.insert({
      planId,
      taskId,
      type: "failed",
      data: { error: errorMessage },
      sequenceNum: sequenceNum++,
    });
    emitAgentEvent(failedEvent);
  } finally {
    if (stagehand) {
      console.log(`[runner] Closing Stagehand | taskId=${taskId}`);
      await stagehand.close().catch(() => {});
    }
  }
}
