import { db } from "../db";
import { plans, tasks } from "../db/schema";
import { eq } from "drizzle-orm";
import { runAgent } from "./runner";

interface PlanContent {
  title: string;
  tasks: { title: string; instruction: string }[];
}

export async function orchestrate(planId: string) {
  try {
    // Fetch plan
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, planId),
    });
    if (!plan) throw new Error("Plan not found");

    const content: PlanContent = JSON.parse(plan.content);

    // Create task records
    const taskRecords = await Promise.all(
      content.tasks.map((t) =>
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

    // Run all agents in parallel
    const results = await Promise.allSettled(
      taskRecords.map((task) => runAgent(task.id, task.instruction))
    );

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
  } catch (err) {
    await db
      .update(plans)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(plans.id, planId));
  }
}
