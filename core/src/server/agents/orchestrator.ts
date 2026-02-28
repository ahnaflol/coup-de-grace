import { db } from "../db";
import { plans, tasks } from "../db/schema";
import { eq } from "drizzle-orm";
import { runAgent } from "./runner";
import { stopAllRunningTasks } from "./stop";

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
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);
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

    for (const task of taskRecords) {
      await runAgent(planId, task.id, task.instruction);
    }

    const updatedTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.planId, planId));

    const allCompleted =
      updatedTasks.length > 0 &&
      updatedTasks.every((t) => t.status === "completed");
    const anyFailed = updatedTasks.some((t) => t.status === "failed");

    const finalStatus = allCompleted && !anyFailed ? "completed" : "failed";

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
