"use client";

import { TaskCard } from "./task-card";
import type { TaskStatus } from "@/types";
import type { TaskMode } from "@/lib/constants";
import type { TaskEventWithTime } from "./execution-dashboard";

function getColumns(count: number): number {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  if (count <= 16) return 4;
  return 5;
}

export function TaskGrid({
  tasks,
  logsByTaskId,
  mode = "testing",
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
    result: unknown;
  }>;
  logsByTaskId: Record<string, TaskEventWithTime[]>;
  mode?: TaskMode;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-600 text-sm">
          Waiting for agents to start...
        </p>
      </div>
    );
  }

  const cols = getColumns(tasks.length);
  const rows = Math.ceil(tasks.length / cols);

  return (
    <div
      className="grid flex-1 min-h-0 gap-px bg-zinc-900"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          events={logsByTaskId[task.id] ?? []}
          mode={mode}
        />
      ))}
    </div>
  );
}
