"use client";

import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_CONFIG } from "@/lib/constants";
import type { TaskStatus } from "@/types";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const cfg = TASK_STATUS_CONFIG[status];
  return (
    <Badge variant="secondary" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

