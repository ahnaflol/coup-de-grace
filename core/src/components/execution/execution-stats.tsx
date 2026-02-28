"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { TaskStatus } from "@/types";
import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";

const STAT_CONFIG = [
  { label: "Running", key: "running" as const, icon: Activity },
  { label: "Completed", key: "completed" as const, icon: CheckCircle2 },
  { label: "Failed", key: "failed" as const, icon: XCircle },
  { label: "Pending", key: "pending" as const, icon: Clock },
] as const;

export function ExecutionStats({
  tasks,
}: {
  tasks: Array<{ status: string }>;
}) {
  const counts: Record<TaskStatus, number> = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  };

  for (const t of tasks) {
    const status = t.status as TaskStatus;
    if (status in counts) counts[status] += 1;
  }

  const total = tasks.length;
  const completed = counts.completed;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Overall progress</p>
            <p className="text-2xl font-bold">{progress}%</p>
          </div>
          <div className="flex gap-4">
            {STAT_CONFIG.map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{counts[stat.key]}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {completed} of {total} tasks completed
        </p>
      </CardContent>
    </Card>
  );
}

