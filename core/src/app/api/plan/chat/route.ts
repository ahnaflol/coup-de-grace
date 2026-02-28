import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai";
import { mistral } from "@ai-sdk/mistral";
import { z } from "zod";
import { db } from "@/server/db";
import { plans } from "@/server/db/schema";
import { planSchema } from "@/server/schemas";
import { PLANNER_SYSTEM_PROMPT } from "@/server/agents/planner-prompt";

function extractTextFromMessage(message: UIMessage): string {
  const textParts = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text);
  return textParts.join("\n");
}

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: UIMessage[] };

  if (!process.env.MISTRAL_API_KEY) {
    return mockResponse();
  }

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: mistral("magistral-medium-latest"),
    system: PLANNER_SYSTEM_PROMPT,
    messages: modelMessages,
    toolChoice: "required",
    stopWhen: stepCountIs(25),
    tools: {
      ask_questions: tool({
        inputSchema: z.object({
          questions: z
            .array(
              z.object({
                id: z.string(),
                question: z.string(),
                type: z.enum(["select", "multi-select", "toggle", "text"]),
                options: z.array(z.string()).optional(),
                placeholder: z.string().optional(),
              })
            )
            .min(1)
            .max(3),
        }),
      }),

      request_credentials: tool({
        inputSchema: z.object({
          reason: z
            .string()
            .describe("Why credentials are needed"),
          knownUrl: z
            .string()
            .optional()
            .describe("URL already mentioned in conversation"),
        }),
      }),

      propose_plan: tool({
        inputSchema: z.object({
          plan: z
            .string()
            .describe(
              "The complete proposed plan in markdown format, including title, target URL, and all tasks with step-by-step instructions",
            ),
        }),
      }),

      finalize_plan: tool({
        inputSchema: planSchema,
        execute: async (plan) => {
          const firstUserMessage = messages.find((m) => m.role === "user");
          const userPrompt = firstUserMessage
            ? extractTextFromMessage(firstUserMessage)
            : "";

          const [row] = await db
            .insert(plans)
            .values({
              userPrompt,
              content: JSON.stringify(plan),
              status: "draft",
            })
            .returning();

          return { planId: row.id, success: true };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}

function mockResponse(): Response {
  return Response.json({
    role: "assistant",
    content:
      "I'd like to help you plan your tasks. Could you tell me more about what you'd like to accomplish? (Mock mode -- no MISTRAL_API_KEY set)",
  });
}
