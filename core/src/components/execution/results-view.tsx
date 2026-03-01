"use client";

import { useMemo, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, Activity, FileText, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { TaskStatus } from "@/types";

interface TaskRow {
  id: string;
  title: string;
  instruction: string;
  status: TaskStatus;
  result: unknown;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractOutcome(result: unknown): {
  passed: boolean | null;
  outcome: string | null;
  summary: string | null;
} {
  if (!isRecord(result)) return { passed: null, outcome: null, summary: null };
  const output = isRecord(result.output) ? result.output : null;
  const outcome =
    output && typeof output.outcome === "string" ? output.outcome : null;
  const summary =
    output && typeof output.summary === "string" ? output.summary : null;
  const isSuccess =
    typeof result.isSuccess === "boolean" ? result.isSuccess : null;
  const passed = outcome ? outcome === "pass" : isSuccess === true ? true : null;
  return { passed, outcome, summary };
}

const STATUS_ICON: Record<TaskStatus, typeof Activity> = {
  running: Activity,
  completed: CheckCircle2,
  failed: XCircle,
  pending: Clock,
};

function generateFailedTestsMd(tasks: TaskRow[]): string {
  const failed = tasks.filter((t) => {
    if (t.status === "pending" || t.status === "running") return false;
    const info = extractOutcome(t.result);
    return info.passed === false || (info.passed === null && t.status === "failed");
  });

  if (failed.length === 0) return "No failed tests.";

  const lines: string[] = ["# Failed Test Cases", ""];

  for (const task of failed) {
    const info = extractOutcome(task.result);
    lines.push(`## ${task.title}`);
    lines.push("");
    lines.push("**Instruction:**");
    lines.push(task.instruction);
    lines.push("");
    if (info.summary) {
      lines.push("**Failure Summary:**");
      lines.push(info.summary);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export function ResultsView({ tasks }: { tasks: TaskRow[] }) {
  const [mdDialogOpen, setMdDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const failedMd = useMemo(() => generateFailedTestsMd(tasks), [tasks]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(failedMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [failedMd]);

  const stats = useMemo(() => {
    let passed = 0;
    let failed = 0;
    let pending = 0;
    let running = 0;

    for (const t of tasks) {
      if (t.status === "pending") {
        pending++;
        continue;
      }
      if (t.status === "running") {
        running++;
        continue;
      }
      const info = extractOutcome(t.result);
      if (info.passed === true) passed++;
      else if (info.passed === false) failed++;
      else if (t.status === "completed") passed++;
      else failed++;
    }

    const finished = passed + failed;
    const total = tasks.length;
    const passRate = finished > 0 ? Math.round((passed / finished) * 100) : 0;

    return { passed, failed, pending, running, finished, total, passRate };
  }, [tasks]);

  const allDone = stats.pending === 0 && stats.running === 0;

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6">
      <div className="max-w-3xl mx-auto">
      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Passed" value={stats.passed} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Failed" value={stats.failed} color="text-red-600 dark:text-red-400" />
        <StatCard
          label="In Progress"
          value={stats.running + stats.pending}
          color="text-muted-foreground"
        />
        <StatCard
          label="Pass Rate"
          value={stats.finished > 0 ? `${stats.passRate}%` : "—"}
          color={
            stats.passRate >= 80
              ? "text-emerald-600 dark:text-emerald-400"
              : stats.passRate >= 50
                ? "text-amber-600 dark:text-amber-400"
                : stats.finished > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
          }
        />
      </div>

      {/* Pass rate bar */}
      {stats.finished > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>
              {stats.finished} of {stats.total} completed
            </span>
            <span>{stats.passRate}% passing</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden flex">
            {stats.passed > 0 && (
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${(stats.passed / stats.total) * 100}%`,
                }}
              />
            )}
            {stats.failed > 0 && (
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{
                  width: `${(stats.failed / stats.total) * 100}%`,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Results list */}
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No tests yet.
        </p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          {tasks.map((task) => {
            const info = extractOutcome(task.result);
            const Icon = STATUS_ICON[task.status];
            const isDone =
              task.status === "completed" || task.status === "failed";

            let verdictLabel: string;
            let verdictVariant: "default" | "destructive" | "secondary" | "outline";
            if (!isDone) {
              verdictLabel =
                task.status === "running" ? "Running" : "Pending";
              verdictVariant = "secondary";
            } else if (info.passed === true) {
              verdictLabel = "PASS";
              verdictVariant = "default";
            } else if (info.passed === false) {
              verdictLabel = "FAIL";
              verdictVariant = "destructive";
            } else {
              verdictLabel = task.status === "completed" ? "PASS" : "FAIL";
              verdictVariant =
                task.status === "completed" ? "default" : "destructive";
            }

            return (
              <div
                key={task.id}
                className="border-b last:border-0 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      task.status === "running"
                        ? "text-emerald-600 dark:text-emerald-400 animate-pulse"
                        : task.status === "completed"
                          ? info.passed === false
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-600 dark:text-emerald-500"
                          : task.status === "failed"
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-sm text-foreground font-medium flex-1 min-w-0">
                    {task.title}
                  </span>
                  <Badge variant={verdictVariant} className={`text-[10px] shrink-0 ${verdictLabel === "PASS" ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}`}>
                    {verdictLabel}
                  </Badge>
                </div>
                {info.summary && (
                  <p className="ml-7 mt-1 text-sm text-muted-foreground leading-relaxed">
                    {info.summary}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Overall verdict */}
      {allDone && tasks.length > 0 && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            {stats.failed === 0 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  All tests passed
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {stats.failed} of {stats.total} tests failed
                </span>
              </>
            )}
          </div>
          {stats.failed > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setMdDialogOpen(true)}
            >
              <FileText className="h-3.5 w-3.5" />
              View as MD
            </Button>
          )}
        </div>
      )}

      {/* Failed tests markdown dialog */}
      <Dialog open={mdDialogOpen} onOpenChange={setMdDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Failed Test Cases</DialogTitle>
            <DialogDescription>
              Copy and paste into your coding agent to fix
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto">
            <pre className="text-sm bg-muted rounded-md p-4 whitespace-pre-wrap break-words font-mono">
              {failedMd}
            </pre>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className={`text-xl font-semibold font-mono ${color}`}>{value}</p>
    </div>
  );
}
