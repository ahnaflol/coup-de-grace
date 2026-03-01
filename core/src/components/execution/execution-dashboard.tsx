"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { trpc } from "@/lib/trpc";
import type { TaskEvent, TaskStatus } from "@/types";
import { ExecutionHeader, type ExecutionTab } from "./execution-header";
import { ResultsView } from "./results-view";

const GlobeView = dynamic(
  () => import("./globe/globe-view").then((m) => m.GlobeView),
  { ssr: false },
);

export interface TaskEventWithTime extends TaskEvent {
  receivedAt: Date;
}

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
  const seenEventIds = useRef(new Set<string>());
  const [activeTab, setActiveTab] = useState<ExecutionTab>("preview");

  const tasksQuery = trpc.execution.getTaskStatuses.useQuery(
    { planId },
    { refetchInterval: 2000 }
  );

  // Fetch historical events from DB so steps/logs load on page refresh or new tab
  const historicalEventsQuery = trpc.execution.getTaskEvents.useQuery(
    { planId },
    { refetchOnWindowFocus: false }
  );

  // Seed eventsByTaskId with historical data once loaded
  useEffect(() => {
    const data = historicalEventsQuery.data;
    if (!data) return;
    setEventsByTaskId((prev) => {
      const next = { ...prev };
      for (const [taskId, events] of Object.entries(data)) {
        const existing = next[taskId] ?? [];
        const newEvents: TaskEventWithTime[] = [];
        for (const e of events) {
          if (!seenEventIds.current.has(e.id)) {
            seenEventIds.current.add(e.id);
            newEvents.push({ ...e, receivedAt: new Date() } as TaskEventWithTime);
          }
        }
        if (newEvents.length > 0) {
          next[taskId] = [...newEvents, ...existing];
        }
      }
      return next;
    });
  }, [historicalEventsQuery.data]);

  trpc.execution.onAgentEvent.useSubscription(
    { planId, lastEventId: subscriptionLastEventId },
    {
      onData(event) {
        if (seenEventIds.current.has(event.id)) return;
        seenEventIds.current.add(event.id);
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

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = { pending: 0, running: 0, completed: 0, failed: 0 };
    for (const t of tasks) {
      if (t.status in c) c[t.status] += 1;
    }
    return c;
  }, [tasks]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ExecutionHeader
        counts={counts}
        total={tasks.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {activeTab === "preview" ? (
        <GlobeView tasks={tasks} logsByTaskId={logsByTaskId} />
      ) : (
        <ResultsView tasks={tasks} />
      )}
    </div>
  );
}
