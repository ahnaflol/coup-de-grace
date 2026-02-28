"use client";

import { useExecutionStore } from "@/stores/use-execution-store";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";

const STAT_CONFIG = [
  { label: "Running", key: "running" as const, icon: Activity, color: "text-primary" },
  { label: "Completed", key: "completed" as const, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
  { label: "Failed", key: "failed" as const, icon: XCircle, color: "text-red-600 dark:text-red-400" },
  { label: "Idle", key: "idle" as const, icon: Clock, color: "text-muted-foreground" },
] as const;

export function ExecutionStats() {
  const { agents, getStatusCounts, getOverallProgress } = useExecutionStore();
  const counts = getStatusCounts();
  const progress = getOverallProgress();

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Overall Progress</p>
            <p className="text-2xl font-bold">{progress}%</p>
          </div>
          <div className="flex gap-4">
            {STAT_CONFIG.map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5">
                <stat.icon className={cn("h-4 w-4", stat.color)} />
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
          {counts.completed} of {agents.length} agents completed
        </p>
      </CardContent>
    </Card>
  );
}
