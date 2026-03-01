import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { PLANNER_SYSTEM_PROMPT } from "@/server/agents/planner-prompt";
import { planSchema } from "@/server/schemas";

const MAX_TOTAL_INTERVIEW_QUESTIONS = 10;
const SOFT_TARGET_INTERVIEW_QUESTIONS = 6;
const MIN_INTERVIEW_QUESTIONS_BEFORE_PROPOSAL = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readToolName(partObj: Record<string, unknown>): string | null {
  const type = partObj.type;
  if (typeof type !== "string") return null;

  if (type === "dynamic-tool") {
    return typeof partObj.toolName === "string" ? partObj.toolName : null;
  }

  if (!type.startsWith("tool-")) return null;
  const name = type.slice(5);
  return name.length > 0 ? name : null;
}

function countAnsweredInterviewQuestions(messages: UIMessage[]): number {
  let count = 0;

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;

    for (const part of msg.parts) {
      if (!isRecord(part)) continue;
      const partObj = part as Record<string, unknown>;
      if (readToolName(partObj) !== "ask_questions") continue;
      if (partObj.state !== "output-available") continue;

      const output = partObj.output;
      if (isRecord(output)) {
        count += Object.keys(output).length;
      }
    }
  }

  return count;
}

function hasToolOutput(messages: UIMessage[], toolName: string): boolean {
  for (const msg of messages) {
    if (msg.role !== "assistant") continue;

    for (const part of msg.parts) {
      if (!isRecord(part)) continue;
      const partObj = part as Record<string, unknown>;
      if (readToolName(partObj) !== toolName) continue;
      if (partObj.state === "output-available") {
        return true;
      }
    }
  }

  return false;
}

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: UIMessage[] };

  if (!process.env.ANTHROPIC_API_KEY) {
    return mockResponse();
  }

  const modelMessages = await convertToModelMessages(messages);
  const answeredQuestionCount = countAnsweredInterviewQuestions(messages);
  const hasCollectedCredentials = hasToolOutput(messages, "request_credentials");
  const remainingQuestionSlots = Math.max(
    0,
    MAX_TOTAL_INTERVIEW_QUESTIONS - answeredQuestionCount,
  );
  const reachedSoftInterviewTarget =
    answeredQuestionCount >= SOFT_TARGET_INTERVIEW_QUESTIONS;
  const canAskMoreQuestions =
    remainingQuestionSlots > 0 &&
    !reachedSoftInterviewTarget &&
    (!hasCollectedCredentials ||
      answeredQuestionCount < MIN_INTERVIEW_QUESTIONS_BEFORE_PROPOSAL);
  const canProposePlan =
    hasCollectedCredentials &&
    answeredQuestionCount >= MIN_INTERVIEW_QUESTIONS_BEFORE_PROPOSAL;
  const maxQuestionsPerCall = Math.max(1, Math.min(3, remainingQuestionSlots));

  const proposedPlanSchema = planSchema.extend({
    planMarkdown: z
      .string()
      .min(1)
      .max(20_000)
      .describe(
        "Full human-readable markdown plan shown to the user for approval.",
      ),
  });

  const systemPrompt = `${PLANNER_SYSTEM_PROMPT}

## Runtime Guardrails (Enforced)
- Max interview questions total: ${MAX_TOTAL_INTERVIEW_QUESTIONS}
- Soft interview target: ${SOFT_TARGET_INTERVIEW_QUESTIONS}
- Minimum interview questions before proposing plan: ${MIN_INTERVIEW_QUESTIONS_BEFORE_PROPOSAL}
- Questions already answered: ${answeredQuestionCount}
- Remaining questions available: ${remainingQuestionSlots}
- Credentials already collected: ${hasCollectedCredentials ? "yes" : "no"}
- Proposal is currently ${canProposePlan ? "allowed" : "not allowed yet"}.
- Ask detailed, high-signal questions when you do ask questions.
- If remaining questions are 0, do NOT call ask_questions again. Move forward with credentials and proposal.
- If credentials are already collected and minimum interview questions are satisfied, do NOT call ask_questions again. Move forward to plan proposal.
- If answered questions are at or above the soft interview target, stop asking questions and move forward.
`;

  const tools = {
    ...(canAskMoreQuestions
      ? {
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
                  }),
                )
                .min(1)
                .max(maxQuestionsPerCall),
            }),
          }),
        }
      : {}),
    request_credentials: tool({
      inputSchema: z.object({
        reason: z.string().describe("Why credentials are needed"),
        knownUrl: z
          .string()
          .optional()
          .describe("URL already mentioned in conversation"),
      }),
    }),
    ...(canProposePlan
      ? {
          propose_plan: tool({
            inputSchema: z.object({
              summary: z
                .string()
                .min(1)
                .max(500)
                .describe("A concise summary of the final plan."),
              taskCount: z
                .number()
                .int()
                .min(1)
                .max(25)
                .describe("How many tasks are included in the final proposal."),
              structuredPlan: proposedPlanSchema.describe(
                "Structured plan for persistence and execution, including full markdown in planMarkdown.",
              ),
            }),
          }),
        }
      : {}),
  };

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: modelMessages,
    maxOutputTokens: 12_000,
    providerOptions: {
      anthropic: {
        // Keep planner thought-stream animations populated when available.
        sendReasoning: true,
      },
    },
    toolChoice: "required",
    stopWhen: stepCountIs(25),
    tools,
  });

  return result.toUIMessageStreamResponse();
}

function mockResponse(): Response {
  return Response.json({
    role: "assistant",
    content:
      "I'd like to help you plan your tasks. Could you tell me more about what you'd like to accomplish? (Mock mode -- no ANTHROPIC_API_KEY set)",
  });
}
