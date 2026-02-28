"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { TaskEvent, TaskStatus } from "@/types";
import { TaskGrid } from "./task-grid";
import Link from "next/link";
import { Swords } from "lucide-react";

export interface TaskEventWithTime extends TaskEvent {
  receivedAt: Date;
}

const STATUS_DOTS: Record<TaskStatus, { color: string; pulse: boolean; label: string }> = {
  running:   { color: "bg-emerald-400", pulse: true,  label: "running" },
  completed: { color: "bg-emerald-600", pulse: false, label: "done" },
  failed:    { color: "bg-red-500",     pulse: false, label: "failed" },
  pending:   { color: "bg-zinc-500",    pulse: false, label: "pending" },
};

export function ExecutionDashboard({ planId }: { planId: string }) {
  const storageKey = `coup:lastEventId:${planId}`;
  const [subscriptionLastEventId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem(storageKey);
    } catch {
      return null;
    }
  });
  const [eventsByTaskId, setEventsByTaskId] = useState<
    Record<string, TaskEventWithTime[]>
  >({});

  const tasksQuery = trpc.execution.getTaskStatuses.useQuery(
    { planId },
    { refetchInterval: 2000 }
  );

  trpc.execution.onAgentEvent.useSubscription(
    { planId, lastEventId: subscriptionLastEventId },
    {
      onData(event) {
        try {
          sessionStorage.setItem(storageKey, event.id);
        } catch {
          // ignore
        }
        const { taskId, type, data, sequenceNum } = event.data;
        const receivedAt = new Date();
        setEventsByTaskId((prev) => ({
          ...prev,
          [taskId]: [
            ...(prev[taskId] ?? []),
            { id: event.id, taskId, type, data, sequenceNum, receivedAt },
          ],
        }));
      },
    }
  );

  const tasks = tasksQuery.data ?? [];

  const logsByTaskId = useMemo(() => {
    return eventsByTaskId;
  }, [eventsByTaskId]);

  // Compute counts for stats strip
  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = { pending: 0, running: 0, completed: 0, failed: 0 };
    for (const t of tasks) {
      if (t.status in c) c[t.status] += 1;
    }
    return c;
  }, [tasks]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Slim header bar with branding + stats */}
      <div className="flex items-center justify-between px-4 h-10 bg-zinc-950 border-b border-zinc-800/60 shrink-0">
        <Link href="/plan" className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight text-zinc-200">
            Coup de Grace
          </span>
        </Link>

        <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono">
          {(["running", "completed", "failed", "pending"] as TaskStatus[]).map((status) => {
            const cfg = STATUS_DOTS[status];
            if (counts[status] === 0) return null;
            return (
              <span key={status} className="flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${cfg.color} ${cfg.pulse ? "animate-pulse" : ""}`} />
                {counts[status]} {cfg.label}
              </span>
            );
          })}
          {tasks.length > 0 && (
            <span className="text-zinc-600">
              {tasks.length} total
            </span>
          )}
        </div>
      </div>

      {/* Full-bleed grid */}
      <TaskGrid tasks={tasks} logsByTaskId={logsByTaskId} />
    </div>
  );
}
