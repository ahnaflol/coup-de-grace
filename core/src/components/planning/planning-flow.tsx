"use client";

import { usePlanningStore } from "@/stores/use-planning-store";
import { PhaseStepper } from "@/components/layout/phase-stepper";
import { ModeSelector } from "./mode-selector";
import { PromptInput } from "./prompt-input";
import { ChatInterface } from "./chat-interface";
import { PlanReview } from "./plan-review";
import { motion, AnimatePresence } from "framer-motion";
import type { PlanningStep } from "@/types";

const stepComponents: Record<PlanningStep, React.ComponentType> = {
  mode: ModeSelector,
  prompt: PromptInput,
  chat: ChatInterface,
  review: PlanReview,
};

export function PlanningFlow() {
  const { currentStep, setStep } = usePlanningStore();
  const StepComponent = stepComponents[currentStep];

  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
      <div className="flex justify-center px-4">
        <PhaseStepper currentStep={currentStep} onStepClick={setStep} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex flex-1 flex-col"
        >
          <StepComponent />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
