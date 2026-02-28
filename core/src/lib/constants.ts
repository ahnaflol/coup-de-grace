import type { PlanningStep, TaskStatus } from "@/types";

export const PLANNING_STEPS: { id: PlanningStep; label: string }[] = [
  { id: "prompt", label: "Prompt" },
  { id: "chat", label: "Refine" },
  { id: "review", label: "Review" },
];

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
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground",
  },
};
