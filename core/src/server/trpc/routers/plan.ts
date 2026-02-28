import { z } from "zod";
import { router, publicProcedure } from "../index";
import { plans, tasks } from "../../db/schema";
import { eq } from "drizzle-orm";
import { planSchema } from "@/server/schemas";

export const planRouter = router({
  get: publicProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [plan] = await ctx.db
        .select()
        .from(plans)
        .where(eq(plans.id, input.planId))
        .limit(1);
      if (!plan) return null;

      const taskRows = await ctx.db
        .select()
        .from(tasks)
        .where(eq(tasks.planId, plan.id));

      const parsed = planSchema.parse(JSON.parse(plan.content));
      return { ...plan, tasks: taskRows, parsed };
    }),

  approve: publicProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(plans)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(plans.id, input.planId))
        .returning();
      return updated;
    }),
});
