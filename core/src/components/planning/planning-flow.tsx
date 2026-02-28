"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { PhaseStepper } from "@/components/layout/phase-stepper";
import { TASK_MODES, THOUGHT_VARIANTS } from "@/lib/constants";
import type { TaskMode } from "@/lib/constants";
import type {
  ThoughtTrace,
  InterviewQuestion,
  Credentials,
} from "@/types";
import { trpc } from "@/lib/trpc";
import { trpcClient } from "@/lib/trpc";
import { PromptInput } from "./prompt-input";
import { ThinkingCanvas } from "./thinking-canvas";
import { InterviewFlow } from "./interview-flow";
import { ChatInterface } from "./chat-interface";
import { PlanReview } from "./plan-review";

type FlowState =
  | { step: "prompt" }
  | {
      step: "thinking";
      thoughts: ThoughtTrace[];
      isComplete: boolean;
      questions: InterviewQuestion[];
    }
  | { step: "interview"; questions: InterviewQuestion[] }
  | { step: "plan-revealed"; planId: string }
  | { step: "review"; planId: string };

function parseInitialState(searchParams: URLSearchParams): FlowState {
  const step = searchParams.get("step");
  const planId = searchParams.get("planId");

  if (step === "review" && planId) return { step: "review", planId };
  if (step === "chat" && planId) return { step: "plan-revealed", planId };
  return { step: "prompt" };
}

function getRandomVariant() {
  return THOUGHT_VARIANTS[Math.floor(Math.random() * THOUGHT_VARIANTS.length)];
}

function buildPlanUrl(step: string, planId: string): string {
  const search = new URLSearchParams();
  search.set("step", step);
  search.set("planId", planId);
  return `/plan?${search.toString()}`;
}

export function PlanningFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();

  const [flowState, setFlowState] = useState<FlowState>(() =>
    parseInitialState(searchParams)
  );
  const [userPrompt, setUserPrompt] = useState("");
  const [userMode, setUserMode] = useState<TaskMode>(TASK_MODES[0].id);
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);

  const currentStep = flowState.step;

  const handlePromptSubmit = useCallback(
    (prompt: string, mode: TaskMode) => {
      setUserPrompt(prompt);
      setUserMode(mode);
      setFlowState({
        step: "thinking",
        thoughts: [],
        isComplete: false,
        questions: [],
      });

      let reasoningText = "";
      let questionsJson = "";
      const pendingThoughts: string[] = [];
      const displayedThoughts: ThoughtTrace[] = [];
      let lastThoughtTime = 0;
      let streamDone = false;
      let flushTimer: ReturnType<typeof setTimeout> | null = null;

      function getInterval() {
        return streamDone ? 400 : 800;
      }

      function showThought(text: string) {
        lastThoughtTime = Date.now();
        displayedThoughts.push({
          id: `thought-${displayedThoughts.length}`,
          text,
          variant: getRandomVariant(),
        });
        setFlowState((prev) => {
          if (prev.step !== "thinking") return prev;
          return { ...prev, thoughts: [...displayedThoughts] };
        });
      }

      function scheduleFlush() {
        if (flushTimer !== null || pendingThoughts.length === 0) return;

        const elapsed = Date.now() - lastThoughtTime;
        const interval = getInterval();
        const delay = lastThoughtTime > 0 ? Math.max(0, interval - elapsed) : 0;

        flushTimer = setTimeout(() => {
          flushTimer = null;
          if (pendingThoughts.length === 0) {
            return;
          }
          showThought(pendingThoughts.shift()!);
          scheduleFlush();
        }, delay);
      }

      function handleReasoning(text: string) {
        reasoningText += text;
        const paragraphs = reasoningText.split(/\n\n+/);
        reasoningText = paragraphs.pop() ?? "";

        for (const para of paragraphs) {
          const cleaned = para.trim().replace(/\s+/g, " ");
          if (cleaned.length > 10) {
            pendingThoughts.push(cleaned);
          }
        }
        scheduleFlush();
      }

      function handleDone() {
        streamDone = true;
        if (flushTimer !== null) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }

        let parsedQuestions: InterviewQuestion[] = [];
        const allQuestionsText = questionsJson.trim();
        if (allQuestionsText) {
          try {
            parsedQuestions = JSON.parse(allQuestionsText);
          } catch {
            toast.error("Failed to parse interview questions");
          }
        }

        setFlowState({
          step: "thinking",
          thoughts: displayedThoughts,
          isComplete: true,
          questions: parsedQuestions,
        });

        setTimeout(() => {
          if (parsedQuestions.length > 0) {
            setFlowState({ step: "interview", questions: parsedQuestions });
          } else {
            handleFinalize(prompt, mode, {}, {
              url: "",
              username: "",
              password: "",
            });
          }
        }, 600);
      }

      subRef.current?.unsubscribe();
      subRef.current = trpcClient.plan.think.subscribe(
        { prompt, mode },
        {
          onData(event) {
            if (event.type === "reasoning") {
              handleReasoning(event.data);
            } else if (event.type === "text") {
              questionsJson += event.data;
            } else if (event.type === "done") {
              handleDone();
            }
          },
          onError(err) {
            const msg = err instanceof Error ? err.message : "Thinking failed";
            toast.error(msg);
            setFlowState({ step: "prompt" });
          },
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleFinalize = useCallback(
    async (
      prompt: string,
      mode: TaskMode,
      answers: Record<string, string | string[]>,
      credentials: Credentials
    ) => {
      try {
        const { planId } = await trpcClient.plan.finalize.mutate({
          prompt,
          mode,
          answers,
          credentials,
        });
        await utils.plan.get.invalidate();
        router.push(buildPlanUrl("chat", planId));
        setFlowState({ step: "plan-revealed", planId });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to finalize plan";
        toast.error(msg);
      }
    },
    [router, utils]
  );

  const handleInterviewComplete = useCallback(
    (answers: Record<string, string | string[]>, credentials: Credentials) => {
      handleFinalize(userPrompt, userMode, answers, credentials);
    },
    [handleFinalize, userPrompt, userMode]
  );

  const planId = useMemo(() => {
    if (flowState.step === "plan-revealed" || flowState.step === "review") {
      return flowState.planId;
    }
    return searchParams.get("planId") ?? undefined;
  }, [flowState, searchParams]);

  const goToReview = useCallback(() => {
    if (flowState.step === "plan-revealed") {
      router.push(buildPlanUrl("review", flowState.planId));
      setFlowState({ step: "review", planId: flowState.planId });
    }
  }, [flowState, router]);

  return (
    <div className="flex flex-1 flex-col">
      {flowState.step !== "thinking" && (
        <div className="flex justify-center px-4 py-6">
          <PhaseStepper currentStep={currentStep} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {flowState.step === "prompt" && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col"
          >
            <PromptInput onSubmit={handlePromptSubmit} />
          </motion.div>
        )}

        {flowState.step === "thinking" && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex-1"
          >
            <ThinkingCanvas
              thoughts={flowState.thoughts}
              isComplete={flowState.isComplete}
            />
          </motion.div>
        )}

        {flowState.step === "interview" && (
          <motion.div
            key="interview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex flex-1 flex-col"
          >
            <InterviewFlow
              questions={flowState.questions}
              onComplete={handleInterviewComplete}
            />
          </motion.div>
        )}

        {flowState.step === "plan-revealed" && (
          <motion.div
            key="plan-revealed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-1 flex-col py-6"
          >
            <ChatInterface planId={planId} onAccept={goToReview} />
          </motion.div>
        )}

        {flowState.step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col py-6"
          >
            <PlanReview
              planId={planId}
              onBackToChat={() => {
                if (planId) {
                  setFlowState({ step: "plan-revealed", planId });
                  router.push(buildPlanUrl("chat", planId));
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
