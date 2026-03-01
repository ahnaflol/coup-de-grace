"use client";

import { TaskDetailSheet } from "./task-detail-sheet";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Info, Database } from "lucide-react";
import type { TaskStatus } from "@/types";
import type { TaskMode } from "@/lib/constants";
import type { TaskEventWithTime } from "./execution-dashboard";
import { isRecord } from "@/lib/utils";

function extractResultInfo(result: unknown) {
  if (!isRecord(result)) return null;
  const output = isRecord(result.output) ? result.output : null;
  const outcome =
    output && typeof output.outcome === "string" ? output.outcome : null;
  const summary =
    output && typeof output.summary === "string" ? output.summary : null;
  const stepsCompleted =
    output && Array.isArray(output.stepsCompleted)
      ? (output.stepsCompleted as string[])
      : [];
  const isSuccess =
    typeof result.isSuccess === "boolean" ? result.isSuccess : null;
  const passed = outcome ? outcome === "pass" : isSuccess === true;
  return { passed, outcome, summary, stepCount: stepsCompleted.length };
}

function extractMigrationResultInfo(result: unknown) {
  if (!isRecord(result)) return null;
  const output = isRecord(result.output) ? result.output : null;
  if (!output) return null;
  const outcome =
    typeof output.outcome === "string" ? output.outcome : null;
  const recordsExtracted =
    typeof output.recordsExtracted === "number" ? output.recordsExtracted : 0;
  const summary =
    typeof output.summary === "string" ? output.summary : null;
  return { outcome, recordsExtracted, summary };
}

const STATUS_DOT: Record<TaskStatus, { color: string; pulse: boolean }> = {
  running:   { color: "bg-emerald-400", pulse: true },
  completed: { color: "bg-emerald-600", pulse: false },
  failed:    { color: "bg-red-500",     pulse: false },
  pending:   { color: "bg-zinc-600",    pulse: false },
};

export function TaskCard({
  task,
  events,
  mode = "testing",
}: {
  task: {
    id: string;
    title: string;
    instruction: string;
    startUrl: string | null;
    status: TaskStatus;
    liveUrl: string | null;
    browserUseSessionId: string | null;
    shareUrl: string | null;
    result: unknown;
  };
  events: TaskEventWithTime[];
  mode?: TaskMode;
}) {
  const dot = STATUS_DOT[task.status];
  const isDone = task.status === "completed" || task.status === "failed";

  return (
    <div className="group relative overflow-hidden bg-zinc-950">
      {/* Live browser iframe, result overlay, or placeholder */}
      {isDone ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
          {mode === "data-migration" ? (() => {
            const migrationInfo = extractMigrationResultInfo(task.result);
            const success = migrationInfo?.outcome === "success" || migrationInfo?.outcome === "partial";
            return (
              <>
                {success ? (
                  <Database className="size-10 text-primary" />
                ) : (
                  <XCircle className="size-10 text-red-500" />
                )}
                <span className="mt-2 text-sm font-bold tracking-widest uppercase text-zinc-300">
                  {migrationInfo?.recordsExtracted ?? 0} record{(migrationInfo?.recordsExtracted ?? 0) !== 1 ? "s" : ""}
                </span>
                {migrationInfo?.summary && (
                  <p className="mt-1.5 text-xs text-zinc-500 text-center max-w-[80%] line-clamp-2">
                    {migrationInfo.summary}
                  </p>
                )}
              </>
            );
          })() : (() => {
            const info = extractResultInfo(task.result);
            const passed = info?.passed ?? task.status === "completed";
            return (
              <>
                {passed ? (
                  <CheckCircle2 className="size-10 text-emerald-500" />
                ) : (
                  <XCircle className="size-10 text-red-500" />
                )}
                <span className="mt-2 text-sm font-bold tracking-widest uppercase text-zinc-300">
                  {passed ? "PASS" : "FAIL"}
                </span>
                {info?.summary && (
                  <p className="mt-1.5 text-xs text-zinc-500 text-center max-w-[80%] line-clamp-2">
                    {info.summary}
                  </p>
                )}
                {info && info.stepCount > 0 && (
                  <span className="mt-1 text-[10px] text-zinc-600">
                    {info.stepCount} step{info.stepCount !== 1 ? "s" : ""} completed
                  </span>
                )}
              </>
            );
          })()}
        </div>
      ) : task.liveUrl ? (
        <iframe
          src={task.liveUrl}
          className="absolute inset-0 h-full w-full border-0"
          allow="clipboard-read; clipboard-write"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-zinc-700 text-center px-4 leading-relaxed max-w-[80%]">
            {task.status === "pending" ? task.title : "Connecting..."}
          </span>
        </div>
      )}

      {/* Status dot — always visible, bottom-left */}
      <div className="absolute bottom-2 left-2 z-10">
        <span
          className={`block size-2 rounded-full ${dot.color} ${dot.pulse ? "animate-pulse" : ""}`}
        />
      </div>

      {/* Hover overlay — fades in from bottom */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-20">
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Content pinned to bottom */}
        <div className="absolute bottom-0 inset-x-0 p-3 space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-white truncate">
              {task.title}
            </h3>
            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mt-0.5">
              {task.instruction}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <TaskDetailSheet
              taskTitle={task.title}
              result={task.result}
              events={events}
              mode={mode}
            >
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-7 text-xs text-zinc-300 hover:text-white hover:bg-white/10"
              >
                <Info className="h-3.5 w-3.5" />
                Details
              </Button>
            </TaskDetailSheet>
          </div>
        </div>
      </div>
    </div>
  );
}
