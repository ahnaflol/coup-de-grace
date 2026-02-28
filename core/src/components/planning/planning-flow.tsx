"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhaseStepper } from "@/components/layout/phase-stepper";
import { PromptInput } from "./prompt-input";
import { ChatInterface } from "./chat-interface";
import { PlanReview } from "./plan-review";
import type { PlanningStep } from "@/types";

function parseStep(value: string | null): PlanningStep {
  if (value === "chat" || value === "review") return value;
  return "prompt";
}

function buildPlanUrl(params: {
  step: PlanningStep;
  planId?: string | null;
}) {
  const search = new URLSearchParams();
  search.set("step", params.step);
  if (params.planId) search.set("planId", params.planId);
  return `/plan?${search.toString()}`;
}

export function PlanningFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const step = useMemo(
    () => parseStep(searchParams.get("step")),
    [searchParams]
  );
  const planId = searchParams.get("planId");

  const goToStep = (nextStep: PlanningStep) => {
    router.push(buildPlanUrl({ step: nextStep, planId }));
  };

  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
      <div className="flex justify-center px-4">
        <PhaseStepper currentStep={step} />
      </div>

      {step === "prompt" && <PromptInput />}
      {step === "chat" && (
        <ChatInterface
          planId={planId ?? undefined}
          onAccept={() => goToStep("review")}
        />
      )}
      {step === "review" && (
        <PlanReview
          planId={planId ?? undefined}
          onBackToChat={() => goToStep("chat")}
        />
      )}
    </div>
  );
}
