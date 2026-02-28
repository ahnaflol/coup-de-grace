import { z } from "zod";
import { router, publicProcedure } from "../index";
import { plans } from "../../db/schema";
import { mistral } from "@ai-sdk/mistral";
import { generateText, Output } from "ai";
import { planSchema } from "@/server/schemas";

const SYSTEM_PROMPT = `You are a test planning assistant for a computer-use agent (CUA) platform. Given a user's message describing what to test on a website, generate a structured test plan.

Output ONLY valid JSON with this exact shape:
{
  "title": "Short plan title",
  "url": "https://target-site.com",
  "credentials": { "email": "user@example.com", "password": "secret" },
  "tasks": [
    {
      "title": "Short task name",
      "description": "What this task tests",
      "hint": "Optional agent nudge (omit if not needed)",
      "url": "https://target-site.com/specific-page (omit to use plan url)",
      "instruction": "Detailed step-by-step instruction for the browser agent"
    }
  ]
}

Rules:
- Each task should be independently executable by a browser agent
- Instructions should be specific and actionable (click, type, navigate, verify, etc.)
- Keep tasks focused - one logical test per task
- If the user requests testing across N sessions (e.g. "across 5 user sessions"), output N tasks (one per session) when feasible. Make each task explicitly start from a fresh session and label them "Session 1", "Session 2", etc.
- Only include "credentials" if the user provided login details; omit it otherwise
- Only include a task-level "url" if it differs from the plan-level "url"; omit it otherwise
- No markdown, no explanation, just the JSON`;

export const chatRouter = router({
  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Generate plan with Mistral
      const { output: parsed } = await generateText({
        model: mistral("mistral-large-latest"),
        system: SYSTEM_PROMPT,
        prompt: input.message,
        output: Output.object({ schema: planSchema }),
      });

      // Persist plan
      const [plan] = await ctx.db
        .insert(plans)
        .values({
          userPrompt: input.message,
          content: JSON.stringify(parsed),
          status: "draft",
        })
        .returning();

      return { plan: { ...plan, parsed } };
    }),
});
