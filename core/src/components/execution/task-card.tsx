"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskEventLog } from "./task-event-log";
import type { TaskStatus } from "@/types";
import type { TaskEventWithTime } from "./execution-dashboard";

export function TaskCard({
  task,
  events,
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
  };
  events: TaskEventWithTime[];
}) {
  const viewerUrl = task.shareUrl ?? task.liveUrl;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-sm font-semibold truncate">{task.title}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {task.instruction}
            </p>
          </div>
          <TaskStatusBadge status={task.status} />
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted">
          {task.liveUrl ? (
            <iframe
              src={task.liveUrl}
              className="absolute inset-0 h-full w-full border-0"
              allow="clipboard-read; clipboard-write"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              Live view not available yet.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <TaskEventLog taskTitle={task.title} events={events} />
          {viewerUrl && (
            <a
              href={viewerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Open live view
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
