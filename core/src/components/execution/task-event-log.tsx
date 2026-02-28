"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollText } from "lucide-react";
import type { AgentEventType } from "@/types";
import type { TaskEventWithTime } from "./execution-dashboard";

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function summarize(
  type: AgentEventType,
  data: unknown
): { action: string; detail: string } {
  if (type === "session_ready" && data && typeof data === "object") {
    const liveUrl =
      isRecord(data) && typeof data.liveUrl === "string"
        ? data.liveUrl
        : null;
    if (liveUrl) {
      return { action: "session_ready", detail: "Live view is ready." };
    }
    return { action: "session_ready", detail: "Session initialized." };
  }
  if (type === "completed") return { action: "completed", detail: "Task completed." };
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

export function TaskEventLog({
  taskTitle,
  events,
}: {
  taskTitle: string;
  events: TaskEventWithTime[];
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs">
          <ScrollText className="h-3.5 w-3.5" />
          Logs ({events.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{taskTitle} - Logs</SheetTitle>
          <SheetDescription>{events.length} events received</SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
          <div className="space-y-3 pr-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No events yet.
              </p>
            ) : (
              events.map((e) => {
                const { action, detail } = summarize(e.type, e.data);
                return (
                  <div
                    key={e.id}
                    className="flex gap-3 rounded-lg border p-3"
                  >
                    <div className="shrink-0 text-[10px] font-mono text-muted-foreground pt-0.5">
                      {formatTime(e.receivedAt)}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {action}{" "}
                        <span className="text-xs text-muted-foreground">
                          #{e.sequenceNum}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {detail}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
