"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { TaskEvent } from "@/types";
import { ExecutionStats } from "./execution-stats";
import { TaskGrid } from "./task-grid";

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

  return (
    <div className="space-y-6">
      <ExecutionStats tasks={tasks} />
      <TaskGrid tasks={tasks} logsByTaskId={logsByTaskId} />
    </div>
  );
}
