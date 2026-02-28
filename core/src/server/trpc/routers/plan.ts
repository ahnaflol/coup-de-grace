import { mistral } from "@ai-sdk/mistral";
import { generateText, Output } from "ai";
import { z } from "zod";

import type { PlanWithTasks } from "../../db/types";
import { router, publicProcedure } from "../index";
import { planContentSchema } from "../schemas";

export const planRouter = router({
  get: publicProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ ctx, input }) => {
      const plan = (await ctx.db.plans.findById(input.planId, {
        withTasks: true,
      })) as PlanWithTasks | null;
      if (!plan) return null;
      const parsed = planContentSchema.parse(JSON.parse(plan.content));
      return { ...plan, parsed };
    }),

  approve: publicProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.plans.update(input.planId, {
        status: "approved",
      });
      return updated;
    }),

  requestChanges: publicProcedure
    .input(
      z.object({
        planId: z.string(),
        feedback: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.plans.findById(input.planId);
      if (!existing) throw new Error("Plan not found");

      const { output: parsed } = await generateText({
        model: mistral("mistral-large-latest"),
        system: `You are a test planning assistant. You previously generated the following test plan:

${existing.content}

The user wants changes. Regenerate the plan incorporating their feedback.`,
        prompt: input.feedback,
        output: Output.object({ schema: planContentSchema }),
      });

      const updated = await ctx.db.plans.update(input.planId, {
        content: JSON.stringify(parsed),
        status: "draft",
      });

      return updated ? { ...updated, parsed } : null;
    }),
});
