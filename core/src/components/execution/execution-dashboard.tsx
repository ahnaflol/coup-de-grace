"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { trpc } from "@/lib/trpc";
import type { TaskEvent, TaskStatus } from "@/types";
import { ExecutionHeader } from "./execution-header";

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

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = { pending: 0, running: 0, completed: 0, failed: 0 };
    for (const t of tasks) {
      if (t.status in c) c[t.status] += 1;
    }
    return c;
  }, [tasks]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ExecutionHeader counts={counts} total={tasks.length} />
      <GlobeView tasks={tasks} logsByTaskId={logsByTaskId} />
    </div>
  );
}
