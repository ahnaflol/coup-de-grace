"use client";

import type { AgentStatus } from "@/types";
import { Monitor } from "lucide-react";

interface AgentBrowserViewProps {
  status: AgentStatus;
  agentName: string;
}

const STATUS_VIEW: Record<AgentStatus, { label: string; bg: string; text: string }> = {
  running: {
    label: "Live View",
    bg: "",
    text: "text-muted-foreground",
  },
  completed: {
    label: "Task Complete",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  failed: {
    label: "Error",
    bg: "bg-red-50 dark:bg-red-950/20",
    text: "text-red-600 dark:text-red-400",
  },
  idle: {
    label: "Waiting",
    bg: "",
    text: "text-muted-foreground/60",
  },
};

export function AgentBrowserView({ status, agentName }: AgentBrowserViewProps) {
  const view = STATUS_VIEW[status];

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted">
      <div className={`absolute inset-0 flex items-center justify-center ${view.bg}`}>
        {status === "running" && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
        )}
        <div className={`z-10 flex flex-col items-center gap-2 ${view.text}`}>
          <Monitor className="h-8 w-8" />
          <span className="text-xs font-medium">{view.label}</span>
          {status === "running" && (
            <span className="text-[10px]">{agentName}</span>
          )}
        </div>
      </div>
    </div>
  );
}
