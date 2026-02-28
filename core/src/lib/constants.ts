import type { PlanningStep, TaskStatus, ThoughtAnimationVariant } from "@/types";

export const PLANNING_STEPS: { id: PlanningStep; label: string }[] = [
  { id: "prompt", label: "Describe" },
  { id: "thinking", label: "Plan" },
  { id: "review", label: "Review" },
];

export const PLANNING_STEP_MAPPING: Record<PlanningStep, PlanningStep> = {
  prompt: "prompt",
  thinking: "thinking",
  review: "review",
};

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  running: {
    label: "Running",
    className: "bg-primary/15 text-primary",
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  failed: {
    label: "Failed",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground",
  },
};

export const THOUGHT_VARIANTS: ThoughtAnimationVariant[] = [
  "typewriter",
  "slide-blur",
  "scale-bounce",
  "wipe-reveal",
  "fade-glow",
];

export const TASK_MODES = [
  { id: "testing", label: "Testing" },
  { id: "data-migration", label: "Data Migration" },
  { id: "data-entry", label: "Data Entry" },
] as const;

export type TaskMode = (typeof TASK_MODES)[number]["id"];
