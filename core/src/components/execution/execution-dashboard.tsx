"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { TaskEvent, TaskStatus } from "@/types";
import type { TaskMode } from "@/lib/constants";
import { TaskGrid } from "./task-grid";
import { ExtractionPanel } from "./extraction-panel";
import Link from "next/link";
import { Swords, Database, Monitor } from "lucide-react";

export interface TaskEventWithTime extends TaskEvent {
  receivedAt: Date;
}

const STATUS_DOTS: Record<TaskStatus, { color: string; pulse: boolean; label: string }> = {
  running:   { color: "bg-emerald-400", pulse: true,  label: "running" },
  completed: { color: "bg-emerald-600", pulse: false, label: "done" },
  failed:    { color: "bg-red-500",     pulse: false, label: "failed" },
  pending:   { color: "bg-zinc-500",    pulse: false, label: "pending" },
};

type DashboardTab = "agents" | "data";
const EMPTY_TASKS: Array<{
  id: string;
  title: string;
  instruction: string;
  startUrl: string | null;
  status: TaskStatus;
  liveUrl: string | null;
  browserUseSessionId: string | null;
  shareUrl: string | null;
  result: unknown;
}> = [];

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
  const [activeTab, setActiveTab] = useState<DashboardTab>("agents");

  const planQuery = trpc.plan.get.useQuery({ planId });
  const mode = (planQuery.data?.mode ?? "testing") as TaskMode;
  const isDataMigration = mode === "data-migration";

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

        // Auto-switch to data tab on first row_extracted event
        if (type === "row_extracted" && isDataMigration) {
          setActiveTab((prev) => prev === "agents" ? "data" : prev);
        }
      },
    }
  );

  const tasks = tasksQuery.data ?? EMPTY_TASKS;

  // Compute counts for stats strip
  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = { pending: 0, running: 0, completed: 0, failed: 0 };
    for (const t of tasks) {
      if (t.status in c) c[t.status] += 1;
    }
    return c;
  }, [tasks]);

  const extractedRowCount = useMemo(() => {
    let count = 0;
    for (const events of Object.values(eventsByTaskId)) {
      for (const e of events) {
        if (e.type === "row_extracted") count++;
      }
    }
    return count;
  }, [eventsByTaskId]);

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
          {isDataMigration && extractedRowCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3 text-primary" />
              {extractedRowCount} row{extractedRowCount !== 1 ? "s" : ""}
            </span>
          )}
          {tasks.length > 0 && (
            <span className="text-zinc-600">
              {tasks.length} total
            </span>
          )}
        </div>
      </div>

      {/* Tab bar for data-migration mode */}
      {isDataMigration && (
        <div className="flex gap-1 px-4 bg-zinc-950 border-b border-zinc-800/60 shrink-0">
          <DashboardTabButton active={activeTab === "agents"} onClick={() => setActiveTab("agents")}>
            <Monitor className="h-3.5 w-3.5" />
            Agents
          </DashboardTabButton>
          <DashboardTabButton active={activeTab === "data"} onClick={() => setActiveTab("data")}>
            <Database className="h-3.5 w-3.5" />
            Data
            {extractedRowCount > 0 && (
              <span className="text-[10px] text-zinc-500">
                ({extractedRowCount})
              </span>
            )}
          </DashboardTabButton>
        </div>
      )}

      {/* Content */}
      {isDataMigration && activeTab === "data" ? (
        <ExtractionPanel eventsByTaskId={eventsByTaskId} tasks={tasks} />
      ) : (
        <TaskGrid tasks={tasks} logsByTaskId={eventsByTaskId} mode={mode} />
      )}
    </div>
  );
}

function DashboardTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
        active
          ? "border-primary text-zinc-100"
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}
