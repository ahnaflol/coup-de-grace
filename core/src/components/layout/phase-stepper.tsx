"use client";

import { cn } from "@/lib/utils";
import { PLANNING_STEPS, PLANNING_STEP_MAPPING } from "@/lib/constants";
import type { PlanningStep } from "@/types";
import { Check } from "lucide-react";

interface PhaseStepperProps {
  currentStep: PlanningStep;
  onStepClick?: (step: PlanningStep) => void;
}

export function PhaseStepper({ currentStep, onStepClick }: PhaseStepperProps) {
  const mappedStep = PLANNING_STEP_MAPPING[currentStep] ?? currentStep;
  const currentIndex = PLANNING_STEPS.findIndex((s) => s.id === mappedStep);

  return (
    <div className="flex items-center gap-2">
      {PLANNING_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isClickable = isCompleted && onStepClick;

        return (
          <div key={step.id} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={cn(
                  "h-px w-6 sm:w-10",
                  index <= currentIndex ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                isCurrent && "bg-primary text-primary-foreground",
                isCompleted &&
                  "bg-primary/15 text-primary cursor-pointer hover:bg-primary/25",
                !isCurrent &&
                  !isCompleted &&
                  "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted && <Check className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{index + 1}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
