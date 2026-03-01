"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  LayoutList,
  ScrollText,
  BarChart3,
} from "lucide-react";
import type { AgentEventType, TaskStatus } from "@/types";
import type { TaskEventWithTime } from "./execution-dashboard";

interface StepData {
  number: number;
  memory?: string;
  evaluationPreviousGoal?: string;
  nextGoal?: string;
  url?: string;
  screenshotUrl?: string | null;
  actions?: unknown[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractSteps(events: TaskEventWithTime[]): StepData[] {
  return events
    .filter((e) => e.type === "step" && isRecord(e.data))
    .map((e) => e.data as StepData)
    .sort((a, b) => a.number - b.number);
}

/* ── Log utilities (absorbed from task-event-log.tsx) ── */

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function summarize(
  type: AgentEventType,
  data: unknown,
): { action: string; detail: string } {
  if (type === "session_ready" && data && typeof data === "object") {
    const liveUrl =
      isRecord(data) && typeof data.liveUrl === "string" ? data.liveUrl : null;
    if (liveUrl) {
      return { action: "session_ready", detail: "Live view is ready." };
    }
    return { action: "session_ready", detail: "Session initialized." };
  }
  if (type === "completed")
    return { action: "completed", detail: "Task completed." };
  if (type === "failed") return { action: "failed", detail: "Task failed." };
  if (type === "error") {
    const message =
      isRecord(data) && typeof data.error === "string"
        ? data.error
        : "Unknown error";
    return { action: "error", detail: message };
  }
  const detail =
    data === undefined ? "" : JSON.stringify(data, null, 2).slice(0, 500);
  return { action: type, detail };
}

/* ── Results Panel ── */

function ResultsPanel({ result }: { result: unknown }) {
  if (!isRecord(result)) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        No result data available.
      </p>
    );
  }

  const output = isRecord(result.output) ? result.output : null;
  const outcome =
    output && typeof output.outcome === "string" ? output.outcome : null;
  const summary =
    output && typeof output.summary === "string" ? output.summary : null;
  const stepsCompleted =
    output && Array.isArray(output.stepsCompleted)
      ? (output.stepsCompleted as string[])
      : [];
  const reason =
    output && typeof output.reason === "string" ? output.reason : null;

  const isSuccess =
    typeof result.isSuccess === "boolean" ? result.isSuccess : null;
  const cost = typeof result.cost === "number" ? result.cost : null;
  const judgeVerdict =
    typeof result.judgeVerdict === "string" ? result.judgeVerdict : null;

  return (
    <div className="space-y-5 p-4">
      {isSuccess !== null && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-400">
            Browser session
          </span>
          <Badge variant={isSuccess ? "default" : "destructive"}>
            {isSuccess ? "Completed" : "Error"}
          </Badge>
        </div>
      )}

      {outcome && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-400">
              Agent task verdict
            </span>
            <Badge
              variant={outcome === "pass" ? "default" : "destructive"}
              className="capitalize"
            >
              {outcome}
            </Badge>
          </div>
          {outcome === "fail" && reason && (
            <p className="text-sm text-red-400/80 leading-relaxed">{reason}</p>
          )}
        </div>
      )}

      {summary && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-200">Summary</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{summary}</p>
        </div>
      )}

      {stepsCompleted.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-200">Steps completed</p>
          <ul className="space-y-1.5">
            {stepsCompleted.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                <span className="text-zinc-400">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reason && outcome !== "fail" && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-200">Reason</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{reason}</p>
        </div>
      )}

      {(cost !== null || judgeVerdict) && (
        <>
          <Separator className="bg-zinc-800" />
          <div className="space-y-2">
            {cost !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Cost</span>
                <span className="font-mono text-zinc-200">
                  ${cost.toFixed(4)}
                </span>
              </div>
            )}
            {judgeVerdict && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Judge verdict</span>
                <span className="text-zinc-200">{judgeVerdict}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Logs Panel ── */

function LogsPanel({ events }: { events: TaskEventWithTime[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">No events yet.</p>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {events.map((e) => {
        const { action, detail } = summarize(e.type, e.data);
        return (
          <div
            key={e.id}
            className="flex gap-3 rounded-lg border border-zinc-800 p-3"
          >
            <div className="shrink-0 text-[10px] font-mono text-zinc-500 pt-0.5">
              {formatTime(e.receivedAt)}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-zinc-200">
                {action}{" "}
                <span className="text-xs text-zinc-500">#{e.sequenceNum}</span>
              </p>
              <p className="text-xs text-zinc-400 whitespace-pre-wrap">
                {detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Steps Panel (two-column + timeline) ── */

function StepsPanel({ steps }: { steps: StepData[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const thumbRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const stripRef = useRef<HTMLDivElement>(null);

  const scrollThumbIntoView = useCallback((index: number) => {
    const el = thumbRefs.current.get(index);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, []);

  useEffect(() => {
    scrollThumbIntoView(currentIndex);
  }, [currentIndex, scrollThumbIntoView]);

  if (steps.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        No step data available.
      </p>
    );
  }

  const step = steps[currentIndex]!;

  return (
    <div className="flex flex-col h-full">
      {/* Two-column: screenshot left, details right */}
      <div className="flex-1 min-h-0 flex gap-4 p-4">
        {/* Left: screenshot (~55%) */}
        <div className="w-[55%] flex flex-col">
          {step.screenshotUrl ? (
            <div className="flex-1 min-h-0 rounded-lg bg-zinc-900 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.screenshotUrl}
                alt={`Step ${step.number} screenshot`}
                className="max-h-[50vh] w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex items-center justify-center rounded-lg bg-zinc-900 text-xs text-zinc-600">
              No screenshot
            </div>
          )}
        </div>

        {/* Right: step details (~45%) */}
        <div className="w-[45%] flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-200">
              Step {step.number} of {steps.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="h-7 w-7 p-0 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentIndex((i) => Math.min(steps.length - 1, i + 1))
                }
                disabled={currentIndex === steps.length - 1}
                className="h-7 w-7 p-0 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3 pr-3">
              {step.nextGoal && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Next goal
                  </p>
                  <p className="text-sm text-zinc-200">{step.nextGoal}</p>
                </div>
              )}

              {step.evaluationPreviousGoal && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Evaluation
                  </p>
                  <p className="text-sm text-zinc-400">
                    {step.evaluationPreviousGoal}
                  </p>
                </div>
              )}

              {step.memory && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Memory
                  </p>
                  <p className="text-sm text-zinc-400">{step.memory}</p>
                </div>
              )}

              {step.url && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    URL
                  </p>
                  <p className="text-xs font-mono break-all text-zinc-400">
                    {step.url}
                  </p>
                </div>
              )}

              {step.actions && step.actions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Actions
                  </p>
                  <pre className="rounded-md bg-zinc-900 border border-zinc-800 p-2 text-xs text-zinc-300 overflow-x-auto">
                    {JSON.stringify(step.actions, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Timeline strip — bottom */}
      {steps.length > 1 && (
        <div className="border-t border-zinc-800 bg-zinc-900/50 rounded-b-lg">
          <div ref={stripRef} className="overflow-x-auto flex gap-3 py-3 px-3">
            {steps.map((s, i) => (
              <button
                key={s.number}
                ref={(el) => {
                  if (el) thumbRefs.current.set(i, el);
                  else thumbRefs.current.delete(i);
                }}
                onClick={() => setCurrentIndex(i)}
                className="shrink-0 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-24 h-16 rounded-lg overflow-hidden transition-all ${
                    i === currentIndex
                      ? "ring-2 ring-orange-500"
                      : "border border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  {s.screenshotUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.screenshotUrl}
                      alt={`Step ${s.number}`}
                      className="w-full h-full object-cover bg-zinc-900"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-600">
                      {s.number}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs ${
                    i === currentIndex
                      ? "text-orange-400 font-semibold"
                      : "text-zinc-500"
                  }`}
                >
                  Step {s.number}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tab button helper ── */

type TabKey = "steps" | "results" | "logs";

function TabButton({
  tabKey,
  activeTab,
  onClick,
  children,
}: {
  tabKey: TabKey;
  activeTab: TabKey;
  onClick: (t: TabKey) => void;
  children: React.ReactNode;
}) {
  const active = activeTab === tabKey;
  return (
    <button
      onClick={() => onClick(tabKey)}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
        active
          ? "border-orange-500 text-zinc-100"
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Main export ── */

export function TaskDetailSheet({
  children,
  taskTitle,
  result,
  events,
  status,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  children?: React.ReactNode;
  taskTitle: string;
  result: unknown;
  events: TaskEventWithTime[];
  status: TaskStatus;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const steps = extractSteps(events);
  const defaultTab: TabKey = steps.length > 0 ? "steps" : "results";
  const [tab, setTab] = useState<TabKey>(defaultTab);

  return (
    <Dialog open={controlledOpen} onOpenChange={controlledOnOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-6xl max-h-[85vh] flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100 p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="truncate text-zinc-100">
            {taskTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-800 px-5 mt-3">
          <TabButton tabKey="steps" activeTab={tab} onClick={setTab}>
            <LayoutList className="h-3.5 w-3.5" />
            Steps ({steps.length})
          </TabButton>
          <TabButton tabKey="results" activeTab={tab} onClick={setTab}>
            <BarChart3 className="h-3.5 w-3.5" />
            Results
          </TabButton>
          <TabButton tabKey="logs" activeTab={tab} onClick={setTab}>
            <ScrollText className="h-3.5 w-3.5" />
            Logs ({events.length})
          </TabButton>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {tab === "steps" ? (
            <StepsPanel steps={steps} />
          ) : tab === "results" ? (
            <ScrollArea className="h-full">
              <ResultsPanel result={result} />
            </ScrollArea>
          ) : (
            <ScrollArea className="h-full">
              <LogsPanel events={events} />
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
