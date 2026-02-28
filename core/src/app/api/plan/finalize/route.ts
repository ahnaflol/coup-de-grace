import { generateText, Output } from "ai";
import { mistral } from "@ai-sdk/mistral";
import { db } from "@/server/db";
import { plans } from "@/server/db/schema";
import { planSchema } from "@/server/schemas";

const FINALIZE_SYSTEM_PROMPT = `You are a test planning assistant for a computer-use agent (CUA) platform. Given a user's task description and their answers to clarifying questions, generate a structured test plan.

Output ONLY valid JSON with this exact shape:
{
  "title": "Short plan title",
  "startUrl": "https://target-site.com",
  "credentials": { "email": "user@example.com", "password": "secret" },
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

export async function POST(req: Request) {
  const { prompt, mode, answers, credentials } = await req.json();

  const answersContext = Object.entries(answers as Record<string, unknown>)
    .map(([q, a]) => `Q: ${q}\nA: ${Array.isArray(a) ? a.join(", ") : a}`)
    .join("\n\n");

  const credentialsContext = credentials?.url
    ? `\nTarget URL: ${credentials.url}\nUsername: ${credentials.username}\nPassword: ${credentials.password}`
    : "";

  const fullPrompt = `Task mode: ${mode}

Original request: ${prompt}

Clarifying answers:
${answersContext}
${credentialsContext}`;

  let planData;

  if (!process.env.MISTRAL_API_KEY) {
    planData = {
      title: "Checkout Flow Testing",
      startUrl: credentials?.url ?? "https://staging.example.com",
      credentials: credentials?.url
        ? { email: credentials.username, password: credentials.password }
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

  const [plan] = await db
    .insert(plans)
    .values({
      userPrompt: prompt,
      content: JSON.stringify(planData),
      status: "draft",
    })
    .returning();

  return Response.json({ planId: plan.id, plan: planData });
}
