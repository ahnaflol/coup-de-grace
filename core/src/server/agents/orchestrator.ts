import { db } from "../db";
import { runAgent } from "./runner";
import { stopAllRunningTasks } from "./stop";

interface PlanContent {
  title: string;
  tasks: { title: string; instruction: string }[];
}

export async function orchestrate(planId: string): Promise<void> {
  try {
    await stopAllRunningTasks({
      reason: `Stopped due to plan ${planId} starting execution`,
    });

    const plan = await db.plans.findById(planId);
    if (!plan) throw new Error("Plan not found");

    const content: PlanContent = JSON.parse(plan.content);

    // TODO: restore all tasks once parallelism is re-enabled
    const tasksToRun = content.tasks.slice(0, 1);

    const taskRecords = await Promise.all(
      tasksToRun.map((t) =>
        db.tasks.insert({
          planId,
          title: t.title,
          instruction: t.instruction,
        })
      )
    );

    // TODO: restore parallelism (maxParallel > 1)
    const maxParallel = 1;
    const results: PromiseSettledResult<unknown>[] = [];

    for (let i = 0; i < taskRecords.length; i += maxParallel) {
      const batch = taskRecords.slice(i, i + maxParallel);
      const batchResults = await Promise.allSettled(
        batch.map((task) => runAgent(planId, task.id, task.instruction))
      );
      results.push(...batchResults);
    }

    // Determine final plan status
    const anyPromiseFailed = results.some((r) => r.status === "rejected");
    const updatedTasks = await db.tasks.findByPlanId(planId);
    const anyTaskFailed = updatedTasks.some((t) => t.status === "failed");

    const finalStatus = anyPromiseFailed || anyTaskFailed ? "failed" : "completed";
    await db.plans.update(planId, { status: finalStatus });
  } catch {
    await db.plans.update(planId, { status: "failed" });
  }
}
