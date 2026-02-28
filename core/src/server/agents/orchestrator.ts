import { db } from "../db";
import { plans, tasks } from "../db/schema";
import { eq } from "drizzle-orm";
import { runAgent } from "./runner";
import { stopAllRunningTasks } from "./stop";
import { Plan } from "@/server/schemas";

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

    const content: Plan = JSON.parse(plan.content);

    const tasksToRun = content.tasks;

    // Create task records
    const taskRecords = await Promise.all(
      tasksToRun.map((t) =>
        db
          .insert(tasks)
          .values({
            planId,
            title: t.title,
            startUrl: t.startUrl ?? content.startUrl,
            instruction: t.instruction,
          })
          .returning()
          .then((rows) => rows[0]),
      ),
    );

    for (const task of taskRecords) {
      if (!task.startUrl) throw new Error(`Task ${task.id} missing startUrl`);
    }

    await Promise.all(
      taskRecords.map((task) =>
        runAgent({
          planId,
          taskId: task.id,
          instruction: task.instruction,
          startUrl: task.startUrl!,
        })
      )
    );

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
