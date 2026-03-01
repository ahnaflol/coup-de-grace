import { mistral } from "@ai-sdk/mistral";
import { generateText } from "ai";
import { planSchema, type Plan } from "../server/schemas";
import { MARKDOWN_PARSER_PROMPT } from "./prompt";

interface ParseMarkdownInput {
  markdown: string;
  targetUrl: string;
  credentials?: { username: string; password: string };
}

export async function parseMarkdownToPlan(
  input: ParseMarkdownInput
): Promise<Plan> {
  const { markdown, targetUrl, credentials } = input;

  let userPrompt = `Target URL: ${targetUrl}\n\n`;

  if (credentials) {
    userPrompt += `Login Credentials:\n- Username: ${credentials.username}\n- Password: ${credentials.password}\n\n`;
  }

  userPrompt += `Markdown Testing Plan:\n\n${markdown}`;

  const { text } = await generateText({
    model: mistral("magistral-medium-latest"),
    system: MARKDOWN_PARSER_PROMPT,
    prompt: userPrompt,
  });

  // Magistral returns JSON wrapped in markdown code fences - strip them
  const jsonStr = text.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");

  let raw: unknown;
  try {
    raw = JSON.parse(jsonStr);
  } catch {
    throw new Error(
      `Failed to parse model output as JSON. Raw output:\n${text.slice(0, 500)}`
    );
  }

  const result = planSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Model output did not match plan schema: ${result.error.message}`
    );
  }

  return result.data;
}
