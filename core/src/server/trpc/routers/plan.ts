import { z } from "zod";
import { router, publicProcedure } from "../index";
import { plans, tasks } from "../../db/schema";
import { eq } from "drizzle-orm";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { planSchema, type Plan } from "@/server/schemas";
import { startApprovedPlanExecution } from "@/server/execution/start-plan-execution";

type PlanMode = Plan["mode"];

const VALID_MODES: readonly PlanMode[] = [
  "testing",
  "data-migration",
  "data-entry",
];

const modeSchema = z.enum(VALID_MODES);
const planPromptConversionSystem =
  "Convert the following plan text into structured JSON. Extract title, target URL, mode, tasks (each with title and instruction), and expected columns if present. Output ONLY valid JSON matching the schema.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const output = value
    .map((entry) => asTrimmedString(entry))
    .filter((entry): entry is string => Boolean(entry));
  return output.length > 0 ? output : undefined;
}

function normalizeMode(value: unknown, fallback: PlanMode = "testing"): PlanMode {
  return VALID_MODES.includes(value as PlanMode)
    ? (value as PlanMode)
    : fallback;
}

function extractFirstUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s)"']+/i);
  return match?.[0]?.trim();
}

function extractPlanMarkdownFromStructured(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;

  const direct = asTrimmedString(value.planMarkdown);
  if (direct) return direct;

  const nested = value.structuredPlan;
  if (nested && nested !== value) {
    return extractPlanMarkdownFromStructured(nested);
  }

  return undefined;
}

function parseTasksFromText(text: string): Plan["tasks"] {
  const tasksSectionMatch = text.match(/(?:^|\n)Tasks:\s*\n([\s\S]*)$/i);
  const source = (tasksSectionMatch?.[1] ?? text).trim();
  if (!source) return [];

  const explicitTaskMatches = [
    ...source.matchAll(
      /\d+\.\s+\*\*(.+?)\*\*[^\S\n]*\n([\s\S]+?)(?=\n\s*\d+\.\s+\*\*|$)/g,
    ),
  ];
  if (explicitTaskMatches.length > 0) {
    return explicitTaskMatches
      .map((match) => ({
        title: match[1].trim(),
        instruction: match[2].trim(),
      }))
      .filter((task) => task.title.length > 0 && task.instruction.length > 0);
  }

  const numberedMatches = [...source.matchAll(/^\s*(\d+)\.\s+(.+)$/gm)];
  if (numberedMatches.length > 0) {
    const tasks: Plan["tasks"] = [];
    for (let index = 0; index < numberedMatches.length; index++) {
      const current = numberedMatches[index];
      const next = numberedMatches[index + 1];
      const line = current[2]!.trim().replace(/^\*\*(.+)\*\*$/, "$1").trim();
      const bodyStart = (current.index ?? 0) + current[0].length;
      const bodyEnd = next?.index ?? source.length;
      const body = source.slice(bodyStart, bodyEnd).trim();
      const title = line || `Task ${index + 1}`;
      const instruction = body || line;
      if (instruction) {
        tasks.push({ title, instruction });
      }
    }
    if (tasks.length > 0) return tasks;
  }

  const bulletMatches = [...source.matchAll(/^\s*[-*]\s+(.+)$/gm)];
  if (bulletMatches.length > 0) {
    return bulletMatches
      .map((match, index) => {
        const textValue = match[1]?.trim() ?? "";
        return {
          title: `Task ${index + 1}`,
          instruction: textValue,
        };
      })
      .filter((task) => task.instruction.length > 0);
  }

  return source.length > 0
    ? [{ title: "Execute Planned Workflow", instruction: source }]
    : [];
}

function parsePlanMarkdown(markdown: string, fallbackMode: PlanMode): Plan {
  const content = markdown.trim();

  const titleMatch =
    content.match(/\*\*Plan:\s*(.+?)\*\*/i) ??
    content.match(/^#\s+(.+)$/m) ??
    content.match(/\*\*(.+?)\*\*/);
  const title = titleMatch?.[1]?.trim() ?? "Untitled Plan";

  const targetUrlMatch = content.match(/Target URL:\s*(\S+)/i);
  const startUrl = targetUrlMatch?.[1]?.trim() ?? extractFirstUrl(content) ?? "";

  const modeMatch = content.match(/Mode:\s*(\S+)/i);
  const mode = normalizeMode(modeMatch?.[1], fallbackMode);

  const expectedColumnsMatch = content.match(/Expected Columns:\s*(.+)/i);
  const expectedColumns = expectedColumnsMatch
    ? expectedColumnsMatch[1]
        .split(/[,\|]/)
        .map((column) => column.trim())
        .filter(Boolean)
    : undefined;

  const tasks = parseTasksFromText(content);

  return {
    title,
    startUrl,
    mode,
    expectedColumns,
    tasks,
  };
}

async function convertTextToPlan(
  text: string,
  fallbackMode: PlanMode,
  logTag: string,
): Promise<Plan> {
  const cleaned = text.trim();
  if (!cleaned) return parsePlanMarkdown("", fallbackMode);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { output } = await generateText({
        model: anthropic("claude-sonnet-4-6"),
        system: planPromptConversionSystem,
        prompt: cleaned,
        output: Output.object({ schema: planSchema }),
      });
      if (output) return output;
    } catch (err) {
      console.warn(`[${logTag}] LLM conversion failed, using parser`, err);
    }
  }

  return parsePlanMarkdown(cleaned, fallbackMode);
}

function coercePlanFromStructured(
  candidate: unknown,
  fallbackMode: PlanMode,
): Plan | null {
  const validated = planSchema.safeParse(candidate);
  if (validated.success) return validated.data;

  if (!isRecord(candidate)) return null;

  const nested = candidate.structuredPlan;
  if (nested && nested !== candidate) {
    const fromNested = coercePlanFromStructured(nested, fallbackMode);
    if (fromNested) return fromNested;
  }

  const rawTasks = Array.isArray(candidate.tasks) ? candidate.tasks : [];
  const tasks = rawTasks
    .map((task, index) => {
      if (!isRecord(task)) return null;
      const title = asTrimmedString(task.title) ?? `Task ${index + 1}`;
      const instruction = asTrimmedString(task.instruction);
      if (!instruction) return null;
      const startUrl = asTrimmedString(task.startUrl);
      return {
        title,
        instruction,
        ...(startUrl ? { startUrl } : {}),
      };
    })
    .filter((task): task is Plan["tasks"][number] => Boolean(task));

  const planMarkdown = extractPlanMarkdownFromStructured(candidate);
  const markdownFallback = planMarkdown
    ? parsePlanMarkdown(planMarkdown, fallbackMode)
    : null;

  const credentials = isRecord(candidate.credentials)
    ? {
        username: asTrimmedString(candidate.credentials.username),
        password: asTrimmedString(candidate.credentials.password),
      }
    : undefined;

  const planCandidate: Plan = {
    title:
      asTrimmedString(candidate.title) ??
      markdownFallback?.title ??
      "Untitled Plan",
    startUrl:
      asTrimmedString(candidate.startUrl) ??
      markdownFallback?.startUrl ??
      extractFirstUrl(planMarkdown ?? "") ??
      "",
    mode: normalizeMode(candidate.mode, fallbackMode),
    expectedColumns:
      asStringArray(candidate.expectedColumns) ?? markdownFallback?.expectedColumns,
    tasks: tasks.length > 0 ? tasks : (markdownFallback?.tasks ?? []),
    ...(credentials?.username && credentials.password
      ? { credentials: credentials as NonNullable<Plan["credentials"]> }
      : {}),
  };

  const parsedCandidate = planSchema.safeParse(planCandidate);
  return parsedCandidate.success ? parsedCandidate.data : null;
}

function hasAnyTask(plan: Plan | null): plan is Plan {
  return Boolean(plan && plan.tasks.length > 0);
}

function hasAnyUrl(plan: Plan | null): boolean {
  if (!plan) return false;
  if (asTrimmedString(plan.startUrl)) return true;
  return plan.tasks.some((task) => Boolean(asTrimmedString(task.startUrl)));
}

function mergePlan(base: Plan | null, fallback: Plan): Plan {
  if (!base) return fallback;

  return {
    title: asTrimmedString(base.title) ?? fallback.title,
    startUrl: asTrimmedString(base.startUrl) ?? fallback.startUrl,
    mode: normalizeMode(base.mode, fallback.mode),
    credentials: base.credentials ?? fallback.credentials,
    expectedColumns:
      (base.expectedColumns?.length ?? 0) > 0
        ? base.expectedColumns
        : fallback.expectedColumns,
    tasks: base.tasks.length > 0 ? base.tasks : fallback.tasks,
  };
}

function normalizePlanForExecution(input: {
  plan: Plan;
  mode: PlanMode;
  fallbackUrl?: string;
}): Plan {
  const { plan, mode, fallbackUrl } = input;

  const normalizedTasks = plan.tasks
    .map((task, index) => {
      const title = asTrimmedString(task.title) ?? `Task ${index + 1}`;
      const instruction = asTrimmedString(task.instruction);
      if (!instruction) return null;

      const taskStartUrl = asTrimmedString(task.startUrl);
      return {
        title,
        instruction,
        ...(taskStartUrl ? { startUrl: taskStartUrl } : {}),
      };
    })
    .filter((task): task is Plan["tasks"][number] => Boolean(task));

  const startUrl =
    asTrimmedString(plan.startUrl) ??
    normalizedTasks.find((task) => Boolean(task.startUrl))?.startUrl ??
    fallbackUrl ??
    "";

  return {
    title: asTrimmedString(plan.title) ?? "Untitled Plan",
    startUrl,
    mode,
    expectedColumns:
      mode === "data-migration" ? plan.expectedColumns : undefined,
    credentials: plan.credentials,
    tasks: normalizedTasks,
  };
}

function assertPlanExecutable(plan: Plan) {
  if (plan.tasks.length === 0) {
    throw new Error("Plan must include at least one task before launch.");
  }

  const missingInstructionIndex = plan.tasks.findIndex(
    (task) => !asTrimmedString(task.instruction),
  );
  if (missingInstructionIndex !== -1) {
    throw new Error(
      `Task ${missingInstructionIndex + 1} is missing an executable instruction.`,
    );
  }

  const hasGlobalUrl = Boolean(asTrimmedString(plan.startUrl));
  const taskMissingUrlIndex = plan.tasks.findIndex(
    (task) => !hasGlobalUrl && !asTrimmedString(task.startUrl),
  );
  if (taskMissingUrlIndex !== -1) {
    throw new Error(
      "Plan is missing a target URL. Add a Target URL line or provide startUrl for each task.",
    );
  }
}

async function resolvePlanFromInputs(input: {
  mode: PlanMode;
  structuredPlan?: unknown;
  planMarkdown?: string;
  assistantTextFallback?: string;
  userPrompt: string;
  logTag: string;
}): Promise<Plan> {
  const { mode, structuredPlan, userPrompt, logTag } = input;
  const planMarkdown =
    asTrimmedString(input.planMarkdown) ??
    extractPlanMarkdownFromStructured(structuredPlan);
  const assistantText = asTrimmedString(input.assistantTextFallback);

  let resolved = coercePlanFromStructured(structuredPlan, mode);

  if ((!hasAnyTask(resolved) || !hasAnyUrl(resolved)) && planMarkdown) {
    const parsedFromMarkdown = await convertTextToPlan(
      planMarkdown,
      mode,
      `${logTag}:markdown`,
    );
    resolved = mergePlan(resolved, parsedFromMarkdown);
  }

  if ((!hasAnyTask(resolved) || !hasAnyUrl(resolved)) && assistantText) {
    const parsedFromAssistant = await convertTextToPlan(
      assistantText,
      mode,
      `${logTag}:assistant`,
    );
    resolved = mergePlan(resolved, parsedFromAssistant);
  }

  if (!resolved) {
    throw new Error("Planner did not return usable plan content.");
  }

  const fallbackUrl =
    extractFirstUrl(userPrompt) ??
    extractFirstUrl(planMarkdown ?? "") ??
    extractFirstUrl(assistantText ?? "");

  const normalized = normalizePlanForExecution({
    plan: resolved,
    mode,
    fallbackUrl,
  });
  assertPlanExecutable(normalized);
  return normalized;
}

async function insertPlan(input: {
  db: Parameters<typeof startApprovedPlanExecution>[0]["db"];
  userPrompt: string;
  plan: Plan;
  status: "draft" | "approved";
}) {
  const [row] = await input.db
    .insert(plans)
    .values({
      userPrompt: input.userPrompt,
      content: JSON.stringify(input.plan),
      status: input.status,
      mode: input.plan.mode,
    })
    .returning();

  return row;
}

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

  savePlan: publicProcedure
    .input(
      z
        .object({
          planMarkdown: z.string().optional(),
          structuredPlan: planSchema.optional(),
          userPrompt: z.string(),
          mode: modeSchema.default("testing"),
        })
        .refine(
          (data) =>
            Boolean(data.structuredPlan) ||
            Boolean(data.planMarkdown && data.planMarkdown.trim().length > 0),
          { message: "Either structuredPlan or planMarkdown is required." },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const mode = normalizeMode(input.mode);
      let plan: Plan;

      if (input.structuredPlan) {
        plan = normalizePlanForExecution({
          plan: input.structuredPlan,
          mode,
          fallbackUrl: extractFirstUrl(input.userPrompt),
        });
      } else {
        const parsed = await convertTextToPlan(
          input.planMarkdown ?? "",
          mode,
          "savePlan",
        );
        plan = normalizePlanForExecution({
          plan: parsed,
          mode,
          fallbackUrl: extractFirstUrl(input.userPrompt),
        });
      }

      const row = await insertPlan({
        db: ctx.db,
        userPrompt: input.userPrompt,
        plan,
        status: "draft",
      });

      return { planId: row.id };
    }),

  finalizeAndLaunch: publicProcedure
    .input(
      z
        .object({
          planMarkdown: z.string().optional(),
          structuredPlan: z.unknown().optional(),
          assistantTextFallback: z.string().optional(),
          userPrompt: z.string(),
          mode: modeSchema.default("testing"),
        })
        .refine(
          (data) =>
            Boolean(data.structuredPlan) ||
            Boolean(data.planMarkdown && data.planMarkdown.trim().length > 0) ||
            Boolean(
              data.assistantTextFallback &&
                data.assistantTextFallback.trim().length > 0,
            ),
          {
            message:
              "At least one plan source is required: structuredPlan, planMarkdown, or assistantTextFallback.",
          },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const mode = normalizeMode(input.mode);
      const resolvedPlan = await resolvePlanFromInputs({
        mode,
        structuredPlan: input.structuredPlan,
        planMarkdown: input.planMarkdown,
        assistantTextFallback: input.assistantTextFallback,
        userPrompt: input.userPrompt,
        logTag: "finalizeAndLaunch",
      });

      const row = await insertPlan({
        db: ctx.db,
        userPrompt: input.userPrompt,
        plan: resolvedPlan,
        status: "approved",
      });

      let launchError: Error | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await startApprovedPlanExecution({ db: ctx.db, planId: row.id });
          return { planId: row.id, started: true as const };
        } catch (err) {
          launchError = err instanceof Error ? err : new Error(String(err));
        }
      }

      return {
        planId: row.id,
        started: false as const,
        error:
          launchError?.message ??
          "Plan was saved but execution could not be started.",
      };
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
        model: anthropic("claude-sonnet-4-6"),
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
