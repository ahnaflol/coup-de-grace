import { z } from "zod";
import { router, publicProcedure } from "../index";
import { plans, tasks } from "../../db/schema";
import { eq } from "drizzle-orm";
import { mistral } from "@ai-sdk/mistral";
import { generateText, streamText, Output } from "ai";
import { planSchema } from "@/server/schemas";

const THINKING_SYSTEM_PROMPT = `You are a planning assistant for a parallel browser agent platform called "Coup de Grace". Users describe a task and you need to generate interview questions to clarify the scope before creating a plan.

Your text output must be ONLY a JSON array of 3-5 interview questions. No markdown, no explanation, just the JSON array.

Each question object must have:
- "id": unique string (e.g., "q1", "q2")
- "question": the question text
- "type": one of "select", "multi-select", "toggle", "text"
- "options": string array (required for "select" and "multi-select", omit for "toggle" and "text")
- "placeholder": string (optional, for "text" type only)

Example output:
[{"id":"q1","question":"What environment should the agents target?","type":"select","options":["Staging","Production","QA"]},{"id":"q2","question":"Which browsers need testing?","type":"multi-select","options":["Chrome","Firefox","Safari","Edge"]},{"id":"q3","question":"Should agents capture screenshots at each step?","type":"toggle"},{"id":"q4","question":"Any specific test data or accounts to use?","type":"text","placeholder":"e.g., test emails, product IDs"}]`;

const FINALIZE_SYSTEM_PROMPT = `You are a test planning assistant for a computer-use agent (CUA) platform. Given a user's task description and their answers to clarifying questions, generate a structured test plan.

Output ONLY valid JSON with this exact shape:
{
  "title": "Short plan title",
  "startUrl": "https://target-site.com",
  "credentials": { "username": "user@example.com", "password": "secret" },
  "tasks": [
    {
      "title": "Short task name",
      "startUrl": "https://target-site.com/specific-page (omit to use plan startUrl)",
      "instruction": "Detailed step-by-step instruction for the browser agent"
    }
  ]
}

Rules:
- Each task should be independently executable by a browser agent
- Instructions should be specific and actionable (click, type, navigate, verify, etc.)
- Keep tasks focused - one logical test per task
- Include credentials only if the user provided them
- Only include a task-level "startUrl" if it differs from the plan-level "startUrl"; omit it otherwise
- No markdown, no explanation, just the JSON`;

const MOCK_REASONING_PARAGRAPHS = [
  "Let me analyze this task carefully and understand the full scope of what the user needs.",
  "The user wants to automate a web application workflow using parallel browser agents. I need to understand the target environment and configuration requirements.",
  "For parallel agent execution, I should figure out the task boundaries and which parts can run independently versus which have dependencies.",
  "I need to consider authentication requirements, since agents will need credentials to access the application under test.",
  "The interview questions should cover the key decision points: target environment, browser selection, observability preferences, and any custom test data.",
  "I'll structure the questions with appropriate input types for the best user experience, using selects for constrained choices and free text for open-ended inputs.",
];

const MOCK_QUESTIONS = [
  {
    id: "q1",
    question: "What environment should the agents target?",
    type: "select" as const,
    options: ["Staging", "Production", "Local development", "QA"],
  },
  {
    id: "q2",
    question: "Which browsers need to be tested?",
    type: "multi-select" as const,
    options: ["Chrome", "Firefox", "Safari", "Edge"],
  },
  {
    id: "q3",
    question: "Should agents capture screenshots at each step?",
    type: "toggle" as const,
  },
  {
    id: "q4",
    question: "Any specific test data or accounts to use?",
    type: "text" as const,
    placeholder: "e.g., test user emails, product IDs...",
  },
];

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

  think: publicProcedure
    .input(z.object({ prompt: z.string(), mode: z.string() }))
    .subscription(async function* ({ input }) {
      if (!process.env.MISTRAL_API_KEY) {
        // Mock fallback
        for (const para of MOCK_REASONING_PARAGRAPHS) {
          yield { type: "reasoning" as const, data: para + "\n\n" };
          await new Promise((r) => setTimeout(r, 600));
        }
        yield { type: "text" as const, data: JSON.stringify(MOCK_QUESTIONS) };
        yield { type: "done" as const, data: "" };
        return;
      }

      const result = streamText({
        model: mistral("magistral-medium-latest"),
        system: THINKING_SYSTEM_PROMPT,
        prompt: `Task mode: ${input.mode}\n\nUser request: ${input.prompt}`,
      });

      for await (const part of result.fullStream) {
        if (part.type === "reasoning-delta") {
          yield { type: "reasoning" as const, data: part.text };
        } else if (part.type === "text-delta") {
          yield { type: "text" as const, data: part.text };
        }
      }

      yield { type: "done" as const, data: "" };
    }),

  finalize: publicProcedure
    .input(
      z.object({
        prompt: z.string(),
        mode: z.string(),
        answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
        credentials: z.object({
          url: z.string(),
          username: z.string(),
          password: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prompt, mode, answers, credentials } = input;

      const answersContext = Object.entries(answers)
        .map(([q, a]) => `Q: ${q}\nA: ${Array.isArray(a) ? a.join(", ") : a}`)
        .join("\n\n");

      const credentialsContext = credentials.url
        ? `\nTarget URL: ${credentials.url}\nUsername: ${credentials.username}\nPassword: ${credentials.password}`
        : "";

      const fullPrompt = `Task mode: ${mode}\n\nOriginal request: ${prompt}\n\nClarifying answers:\n${answersContext}${credentialsContext}`;

      let planData;

      if (!process.env.MISTRAL_API_KEY) {
        planData = {
          title: "Checkout Flow Testing",
          startUrl: credentials.url || "https://staging.example.com",
          credentials: credentials.url
            ? { username: credentials.username, password: credentials.password }
            : undefined,
          tasks: [
            {
              title: "Guest Checkout - Credit Card",
              instruction:
                "Navigate to product page, add item to cart, proceed as guest, enter shipping details, pay with credit card, verify confirmation page.",
            },
            {
              title: "Registered User - Saved Payment",
              instruction:
                "Log in with test account, add items to cart, use saved payment method, verify order history update.",
            },
            {
              title: "Discount Code Checkout",
              instruction:
                "Add items to cart, apply discount code, verify price calculation, complete checkout.",
            },
          ],
        };
      } else {
        const { output: parsed } = await generateText({
          model: mistral("mistral-large-latest"),
          system: FINALIZE_SYSTEM_PROMPT,
          prompt: fullPrompt,
          output: Output.object({ schema: planSchema }),
        });
        planData = parsed;
      }

      const [plan] = await ctx.db
        .insert(plans)
        .values({
          userPrompt: prompt,
          content: JSON.stringify(planData),
          status: "draft",
        })
        .returning();

      return { planId: plan.id, plan: planData };
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(plans)
        .where(eq(plans.id, input.planId))
        .limit(1);
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
