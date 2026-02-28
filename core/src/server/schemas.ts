import { z } from "zod";

export const planTaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  startUrl: z.string().optional(), // If overriding the plan's startUrl, otherwise use the plan's startUrl
  instruction: z.string(),
});

export const planSchema = z.object({
  title: z.string(),
  startUrl: z.string(),
  credentials: z
    .object({
      email: z.string(),
      password: z.string(),
    })
    .optional(),
  tasks: z.array(planTaskSchema),
});

export const agentResultSchema = z.object({
  outcome: z.enum(["pass", "fail"]),
  summary: z.string(),
  stepsCompleted: z.array(z.string()).default([]),
  reason: z.string().optional(),
});

export type Plan = z.infer<typeof planSchema>;
export type PlanTask = z.infer<typeof planTaskSchema>;
export type AgentResult = z.infer<typeof agentResultSchema>;
