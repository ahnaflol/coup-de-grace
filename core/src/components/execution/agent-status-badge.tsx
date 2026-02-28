"use client";

import { cn } from "@/lib/utils";
import { AGENT_STATUS_CONFIG } from "@/lib/constants";
import type { AgentStatus } from "@/types";

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

const DOT_COLORS: Record<AgentStatus, string> = {
  running: "bg-primary",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
  idle: "bg-muted-foreground/40",
};

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const config = AGENT_STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {status === "running" ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
      ) : (
        <span className={cn("h-2 w-2 rounded-full", DOT_COLORS[status])} />
      )}
      {config.label}
    </span>
  );
}
