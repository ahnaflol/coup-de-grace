import { and, eq } from "drizzle-orm";
import { plans } from "@/server/db/schema";
import { orchestrate } from "@/server/agents/orchestrator";
import type { createTRPCContext } from "@/server/trpc";

type DbClient = ReturnType<typeof createTRPCContext>["db"];

export async function startApprovedPlanExecution(input: {
  db: DbClient;
  planId: string;
}) {
  const { db, planId } = input;

  const [locked] = await db
    .update(plans)
    .set({ status: "executing", updatedAt: new Date() })
    .where(and(eq(plans.id, planId), eq(plans.status, "approved")))
    .returning({ id: plans.id });

  if (!locked) {
    const [plan] = await db
      .select({ id: plans.id, status: plans.status })
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!plan) throw new Error("Plan not found");

    // Idempotent success path for duplicate launch requests.
    if (plan.status === "executing") {
      return { started: true as const, planId, alreadyExecuting: true as const };
    }

    throw new Error(
      `Plan must be approved before execution (current status: ${plan.status})`,
    );
  }

  // Fire-and-forget
  orchestrate(planId).catch(console.error);

  return { started: true as const, planId, alreadyExecuting: false as const };
}
