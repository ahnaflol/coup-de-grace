import { z } from "zod";
import { router, publicProcedure } from "../index";
import { plans } from "../../db/schema";
import { eq } from "drizzle-orm";
import { mistral } from "@ai-sdk/mistral";
import { generateText, Output } from "ai";

const planSchema = z.object({
  title: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      instruction: z.string(),
    })
  ),
});

export const planRouter = router({
  get: publicProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ ctx, input }) => {
      const plan = await ctx.db.query.plans.findFirst({
        where: eq(plans.id, input.planId),
        with: { tasks: true },
      });
      if (!plan) return null;
      const parsed = planSchema.parse(JSON.parse(plan.content));
      return { ...plan, parsed };
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

  requestChanges: publicProcedure
    .input(
      z.object({
        planId: z.string(),
        feedback: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.plans.findFirst({
        where: eq(plans.id, input.planId),
      });
      if (!existing) throw new Error("Plan not found");

      const { output: parsed } = await generateText({
        model: mistral("mistral-large-latest"),
        system: `You are a test planning assistant. You previously generated the following test plan:

${existing.content}

The user wants changes. Regenerate the plan incorporating their feedback.`,
        prompt: input.feedback,
        output: Output.object({ schema: planSchema }),
      });

      const [updated] = await ctx.db
        .update(plans)
        .set({
          content: JSON.stringify(parsed),
          status: "draft",
          updatedAt: new Date(),
        })
        .where(eq(plans.id, input.planId))
        .returning();

      return { ...updated, parsed };
    }),
});
