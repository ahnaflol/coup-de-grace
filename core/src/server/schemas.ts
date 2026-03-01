import { z } from "zod";

export const planTaskSchema = z.object({
  title: z.string(),
  instruction: z.string(),
  startUrl: z.string().optional(), // overrides plan.startUrl for this task
});

export const planSchema = z.object({
  title: z.string().describe("The plan title"),
  startUrl: z.string().describe("The target URL where agents will operate"),
  credentials: z
    .object({
      username: z.string(),
      password: z.string(),
    })
    .optional()
    .describe("Login credentials if collected during the interview"),
  mode: z
    .enum(["testing", "data-migration", "data-entry"])
    .default("testing")
    .describe("The task mode specified in the user's initial message"),
  expectedColumns: z
    .array(z.string())
    .optional()
    .describe(
      "For data-migration mode only: column names the agents should extract",
    ),
  tasks: z
    .array(planTaskSchema)
    .describe("Array of parallel tasks, each with a title and detailed browser instruction"),
});

export const agentResultSchema = z.object({
  outcome: z.enum(["pass", "fail"]),
  summary: z.string(),
  stepsCompleted: z.array(z.string()).default([]),
  reason: z.string().optional(),
});

export const extractionResultSchema = z.object({
  outcome: z.enum(["success", "partial", "fail"]),
  extractedRows: z.array(z.record(z.string(), z.string())),
  summary: z.string(),
  recordsFound: z.number(),
  recordsExtracted: z.number(),
  reason: z.string().optional(),
});

export type Plan = z.infer<typeof planSchema>;
export type PlanTask = z.infer<typeof planTaskSchema>;
export type AgentResult = z.infer<typeof agentResultSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;
