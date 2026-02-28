import { mistral } from "@ai-sdk/mistral";
import { generateText, Output } from "ai";
import { z } from "zod";

import { router, publicProcedure } from "../index";
import { planContentSchema } from "../schemas";

const SYSTEM_PROMPT = `You are a test planning assistant for a computer-use agent (CUA) platform. Given a user's message describing what to test on a website, generate a structured test plan.

Output ONLY valid JSON with this exact shape:
{
  "title": "Short plan title",
  "tasks": [
    {
      "title": "Short task title",
      "instruction": "Detailed step-by-step instruction for the browser agent to execute this test"
    }
  ]
}

Rules:
- Each task should be independently executable by a browser agent
- Instructions should be specific and actionable (click, type, navigate, verify, etc.)
- Keep tasks focused - one logical test per task
- If the user requests testing across N sessions (e.g. "across 5 user sessions"), output N tasks (one per session) when feasible. Make each task explicitly start from a fresh session and label them "Session 1", "Session 2", etc.
- Include the target URL in each task's instruction if relevant
- No markdown, no explanation, just the JSON`;

export const chatRouter = router({
  sendMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let sessionId = input.sessionId;
      if (!sessionId) {
        const session = await ctx.db.sessions.insert({
          title: input.message.slice(0, 100),
        });
        sessionId = session.id;
      }

      const { output: parsed } = await generateText({
        model: mistral("mistral-large-latest"),
        system: SYSTEM_PROMPT,
        prompt: input.message,
        output: Output.object({ schema: planContentSchema }),
      });

      const plan = await ctx.db.plans.insert({
        sessionId,
        userPrompt: input.message,
        content: JSON.stringify(parsed),
        status: "draft",
      });

      return { sessionId, plan: { ...plan, parsed } };
    }),
});
