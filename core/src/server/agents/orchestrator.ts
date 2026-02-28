import { db } from "../db";
import { plans, tasks } from "../db/schema";
import { eq } from "drizzle-orm";
import { runAgent } from "./runner";
import { stopAllRunningTasks } from "./stop";
import { ORCHESTRATOR_MAX_PARALLEL_TASKS } from "./config";

interface PlanContent {
  title: string;
  tasks: { title: string; instruction: string }[];
}

export async function orchestrate(planId: string) {
  try {
    await stopAllRunningTasks({
      reason: `Stopped due to plan ${planId} starting execution`,
    });

    // Fetch plan
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, planId),
    });
    if (!plan) throw new Error("Plan not found");

    const content: PlanContent = JSON.parse(plan.content);

    // TODO: restore all tasks once parallelism is re-enabled
    const tasksToRun = content.tasks.slice(0, 1);

    // Create task records
    const taskRecords = await Promise.all(
      tasksToRun.map((t) =>
        db
          .insert(tasks)
          .values({
            planId,
            title: t.title,
            instruction: t.instruction,
          })
          .returning()
          .then((rows) => rows[0])
      )
    );

    // Update plan status
    await db
      .update(plans)
      .set({ status: "executing", updatedAt: new Date() })
      .where(eq(plans.id, planId));

    const maxParallel = 1; // TODO: restore parallelism (ORCHESTRATOR_MAX_PARALLEL_TASKS)
    const results: PromiseSettledResult<unknown>[] = [];

    for (let i = 0; i < taskRecords.length; i += maxParallel) {
      const batch = taskRecords.slice(i, i + maxParallel);
      const batchResults = await Promise.allSettled(
        batch.map((task) => runAgent(planId, task.id, task.instruction))
      );
      results.push(...batchResults);
    }

    // Determine final plan status
    const anyFailed = results.some((r) => r.status === "rejected");
    const allFulfilled = results.every((r) => r.status === "fulfilled");

    // Check if any tasks themselves failed (even if promise resolved)
    const updatedTasks = await db.query.tasks.findMany({
      where: eq(tasks.planId, planId),
    });
    const anyTaskFailed = updatedTasks.some((t) => t.status === "failed");

    const finalStatus =
      anyFailed || anyTaskFailed ? "failed" : allFulfilled ? "completed" : "failed";

    await db
      .update(plans)
      .set({ status: finalStatus, updatedAt: new Date() })
      .where(eq(plans.id, planId));
  } catch {
    await db
      .update(plans)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(plans.id, planId));
  }
}
