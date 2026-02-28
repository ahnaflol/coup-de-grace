import type { AgentStatus, ModeOption, PlanningStep } from "@/types";

export const TASK_MODES: ModeOption[] = [
  {
    id: "testing",
    title: "Testing",
    description:
      "Automated browser testing across multiple scenarios and environments in parallel.",
    icon: "FlaskConical",
  },
  {
    id: "data-migration",
    title: "Data Migration",
    description:
      "Move data between systems with parallel agents handling batches simultaneously.",
    icon: "DatabaseZap",
  },
  {
    id: "data-entry",
    title: "Data Entry",
    description:
      "Parallel form filling and data input across multiple browser sessions.",
    icon: "ClipboardPen",
  },
];

export const PLANNING_STEPS: { id: PlanningStep; label: string }[] = [
  { id: "mode", label: "Mode" },
  { id: "prompt", label: "Prompt" },
  { id: "chat", label: "Refine" },
  { id: "review", label: "Review" },
];

export const AGENT_STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; className: string }
> = {
  idle: {
    label: "Idle",
    className: "bg-muted text-muted-foreground",
  },
  running: {
    label: "Running",
    className: "bg-primary/15 text-primary",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};
