import { BrowserUse, type SupportedLLMs } from "browser-use-sdk";
import { z } from "zod";

export interface ScoutObservations {
  url: string;
  summary: string;
  pages: { url: string; description: string }[];
  uiElements: string[];
  navigationPaths: string[];
  forms: string[];
  scoutingFailed: boolean;
}

const observationsSchema = z.object({
  summary: z
    .string()
    .describe("High-level description of the web application and its purpose"),
  pages: z
    .array(
      z.object({
        url: z.string().describe("URL of the discovered page"),
        description: z
          .string()
          .describe("What this page contains and its purpose"),
      })
    )
    .describe("Pages discovered while exploring the application"),
  uiElements: z
    .array(z.string())
    .describe(
      "Interactive UI elements found: buttons, dropdowns, tables, modals, etc."
    ),
  navigationPaths: z
    .array(z.string())
    .describe("Navigation links and menu items discovered"),
  forms: z
    .array(z.string())
    .describe(
      "Forms and input fields found, including field names and types"
    ),
});

const SCOUT_INSTRUCTION = `You are a UI scout exploring a web application to understand its structure.

Your goals:
- Navigate the main pages using the navigation menu and links
- Identify all forms, input fields, buttons, and interactive elements
- Note the page structure, layout, and key UI components
- Discover available routes and navigation paths
- Observe tables, lists, modals, and other data displays

Rules:
- Do NOT test anything, submit forms, or modify data
- Do NOT create accounts or log in
- Just observe and report what you see
- Focus on understanding the application's structure and capabilities
- Stop once you have a thorough understanding of the main pages`;

// The SDK types may not list newer models yet — the API itself accepts them
const SCOUT_LLM = "gpt-5.3-codex" as SupportedLLMs;
const FALLBACK_LLM: SupportedLLMs = "gpt-4.1";

const SCOUT_RUN_OPTIONS = {
  schema: observationsSchema,
  vision: true,
  maxSteps: 50,
  thinking: true,
  systemPromptExtension:
    "You are scouting this application to help generate a test plan. Focus on discovering testable interactions, form fields, navigation flows, and data displays.",
  timeout: 120_000,
} as const;

function emptyObservations(url: string): ScoutObservations {
  return {
    url,
    summary: "",
    pages: [],
    uiElements: [],
    navigationPaths: [],
    forms: [],
    scoutingFailed: true,
  };
}

async function runScout(
  client: BrowserUse,
  url: string,
  llm: SupportedLLMs,
): Promise<ScoutObservations> {
  const result = await client.run(SCOUT_INSTRUCTION, {
    ...SCOUT_RUN_OPTIONS,
    startUrl: url,
    llm,
  });
  const output = result.output as unknown as z.infer<typeof observationsSchema>;
  return {
    url,
    summary: output.summary,
    pages: output.pages,
    uiElements: output.uiElements,
    navigationPaths: output.navigationPaths,
    forms: output.forms,
    scoutingFailed: false,
  };
}

export async function scoutTarget(url: string): Promise<ScoutObservations> {
  const apiKey = process.env.BROWSER_USE_API_KEY;
  if (!apiKey) {
    console.warn("[scout] BROWSER_USE_API_KEY not set, skipping scouting");
    return emptyObservations(url);
  }

  console.log(`[scout] Starting scouting for ${url}`);
  const client = new BrowserUse({ apiKey });

  try {
    const observations = await runScout(client, url, SCOUT_LLM);
    console.log(`[scout] Scouting complete for ${url}`);
    return observations;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[scout] Scouting failed for ${url}: ${message}`);

    // Retry with fallback model if the primary model was rejected
    if (message.includes("llm") || message.includes("model")) {
      console.log(`[scout] Retrying with fallback model: ${FALLBACK_LLM}`);
      try {
        const observations = await runScout(client, url, FALLBACK_LLM);
        console.log(`[scout] Fallback scouting complete for ${url}`);
        return observations;
      } catch (fallbackErr) {
        const fallbackMsg =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : String(fallbackErr);
        console.error(`[scout] Fallback scouting also failed: ${fallbackMsg}`);
      }
    }

    return emptyObservations(url);
  }
}
