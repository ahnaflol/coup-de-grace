"use client";

import { TaskCard } from "./task-card";
import type { TaskStatus } from "@/types";
import type { TaskEventWithTime } from "./execution-dashboard";

export function TaskGrid({
  tasks,
  logsByTaskId,
}: {
  tasks: Array<{
    id: string;
    title: string;
    instruction: string;
    startUrl: string | null;
    status: TaskStatus;
    liveUrl: string | null;
    browserUseSessionId: string | null;
    shareUrl: string | null;
  }>;
  logsByTaskId: Record<string, TaskEventWithTime[]>;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">
          No tasks yet. If execution just started, this may take a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          events={logsByTaskId[task.id] ?? []}
        />
      ))}
    </div>
  );
}
