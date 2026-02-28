"use client";

import { cn } from "@/lib/utils";
import { TASK_MODES } from "@/lib/constants";
import { usePlanningStore } from "@/stores/use-planning-store";
import { FlaskConical, DatabaseZap, ClipboardPen } from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FlaskConical,
  DatabaseZap,
  ClipboardPen,
};

export function ModeSelector() {
  const { selectedMode, setMode } = usePlanningStore();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          What would you like to do?
        </h2>
        <p className="text-muted-foreground">
          Select a task mode to get started with your parallel agents.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {TASK_MODES.map((mode) => {
          const Icon = ICONS[mode.icon];
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setMode(mode.id)}
              className={cn(
                "group relative flex flex-col items-center gap-4 rounded-xl border-2 p-6 text-center transition-all hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary-muted shadow-md"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}
              >
                {Icon && <Icon className="h-7 w-7" />}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold">{mode.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {mode.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
