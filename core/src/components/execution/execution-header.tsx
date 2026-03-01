"use client";

import Link from "next/link";
import { Swords, Activity, CheckCircle2, XCircle, Clock, Globe, BarChart3 } from "lucide-react";
import type { TaskStatus } from "@/types";

export type ExecutionTab = "preview" | "results";

const STATUS_CONFIG: Record<TaskStatus, { icon: typeof Activity; label: string }> = {
  running:   { icon: Activity,     label: "running" },
  completed: { icon: CheckCircle2, label: "done" },
  failed:    { icon: XCircle,      label: "failed" },
  pending:   { icon: Clock,        label: "pending" },
};

export function ExecutionHeader({
  counts,
  total,
  activeTab,
  onTabChange,
}: {
  counts: Record<TaskStatus, number>;
  total: number;
  activeTab: ExecutionTab;
  onTabChange: (tab: ExecutionTab) => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm shrink-0">
      <div className="flex h-14 items-center px-4 sm:px-6">
        <Link href="/plan" className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">
            Coup de Grace
          </span>
        </Link>

        {/* Tabs — centered */}
        <nav className="flex-1 flex items-center justify-center gap-1">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
            <TabBtn
              active={activeTab === "preview"}
              onClick={() => onTabChange("preview")}
            >
              <Globe className="h-3.5 w-3.5" />
              Preview
            </TabBtn>
            <TabBtn
              active={activeTab === "results"}
              onClick={() => onTabChange("results")}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Results
            </TabBtn>
          </div>
        </nav>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {(["running", "completed", "failed", "pending"] as TaskStatus[]).map((status) => {
            if (counts[status] === 0) return null;
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <span key={status} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                <span className="font-mono text-xs">
                  {counts[status]} {cfg.label}
                </span>
              </span>
            );
          })}
          {total > 0 && (
            <span className="text-xs text-muted-foreground/60">
              {total} total
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
