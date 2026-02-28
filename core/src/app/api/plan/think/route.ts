import { streamText } from "ai";
import { mistral } from "@ai-sdk/mistral";

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

const encoder = new TextEncoder();

/**
 * Custom stream protocol:
 * - Lines starting with "R:" are reasoning/thinking deltas
 * - Lines starting with "T:" are text (questions JSON) deltas
 * - Line "DONE" signals completion
 */
export async function POST(req: Request) {
  const { prompt, mode } = await req.json();

  if (!process.env.MISTRAL_API_KEY) {
    return mockThinkingStream();
  }

  const result = streamText({
    model: mistral("magistral-medium-latest"),
    system: THINKING_SYSTEM_PROMPT,
    prompt: `Task mode: ${mode}\n\nUser request: ${prompt}`,
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          if (part.type === "reasoning-delta") {
            controller.enqueue(
              encoder.encode(`R:${JSON.stringify(part.text)}\n`)
            );
          } else if (part.type === "text-delta") {
            controller.enqueue(
              encoder.encode(`T:${JSON.stringify(part.text)}\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("DONE\n"));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function mockThinkingStream(): Response {
  const mockReasoningParagraphs = [
    "Let me analyze this task carefully and understand the full scope of what the user needs.",
    "The user wants to automate a web application workflow using parallel browser agents. I need to understand the target environment and configuration requirements.",
    "For parallel agent execution, I should figure out the task boundaries and which parts can run independently versus which have dependencies.",
    "I need to consider authentication requirements, since agents will need credentials to access the application under test.",
    "The interview questions should cover the key decision points: target environment, browser selection, observability preferences, and any custom test data.",
    "I'll structure the questions with appropriate input types for the best user experience, using selects for constrained choices and free text for open-ended inputs.",
  ];

  const mockQuestions = JSON.stringify([
    {
      id: "q1",
      question: "What environment should the agents target?",
      type: "select",
      options: ["Staging", "Production", "Local development", "QA"],
    },
    {
      id: "q2",
      question: "Which browsers need to be tested?",
      type: "multi-select",
      options: ["Chrome", "Firefox", "Safari", "Edge"],
    },
    {
      id: "q3",
      question: "Should agents capture screenshots at each step?",
      type: "toggle",
    },
    {
      id: "q4",
      question: "Any specific test data or accounts to use?",
      type: "text",
      placeholder: "e.g., test user emails, product IDs...",
    },
  ]);

  let paraIndex = 0;
  let questionsSent = false;

  const stream = new ReadableStream({
    async pull(controller) {
      if (paraIndex < mockReasoningParagraphs.length) {
        const para = mockReasoningParagraphs[paraIndex];
        paraIndex++;
        // Send paragraph text followed by double newline (paragraph break)
        const text = para + "\n\n";
        controller.enqueue(
          encoder.encode(`R:${JSON.stringify(text)}\n`)
        );
        // Simulate model thinking delay
        await new Promise((r) => setTimeout(r, 600));
        return;
      }

      if (!questionsSent) {
        questionsSent = true;
        controller.enqueue(
          encoder.encode(`T:${JSON.stringify(mockQuestions)}\n`)
        );
        controller.enqueue(encoder.encode("DONE\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
