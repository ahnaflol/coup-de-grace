"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { PhaseStepper } from "@/components/layout/phase-stepper";
import { THOUGHT_VARIANTS } from "@/lib/constants";
import type { TaskMode } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  findLatestPlannerToolFailure,
  findLatestPlannerToolPartByState,
  getLastAssistantPlannerToolPartsDebug,
} from "@/lib/planner-tool-parts";
import type { ThoughtTrace } from "@/types";
import type { UIMessage } from "ai";
import { usePlannerChat } from "@/hooks/use-planner-chat";
import type {
  AskQuestionsInput,
  RequestCredentialsInput,
  CredentialsResult,
  ProposePlanInput,
} from "@/hooks/use-planner-chat";
import { PromptInput } from "./prompt-input";
import { ThinkingCanvas } from "./thinking-canvas";
import { QuestionOverlay } from "./question-overlay";
import { CredentialsOverlay } from "./credentials-overlay";
import { PlanProposalOverlay } from "./plan-proposal-overlay";
import { PlanReview } from "./plan-review";

type Phase = "initial" | "thinking" | "finalized";

function getRandomVariant() {
  return THOUGHT_VARIANTS[Math.floor(Math.random() * THOUGHT_VARIANTS.length)];
}

// ---------------------------------------------------------------------------
// Message inspection helpers
// ---------------------------------------------------------------------------

interface PendingToolCall {
  toolCallId: string;
  toolName: string;
  input: unknown;
  ready: boolean; // true when input is fully available (not still streaming)
}

/** States that mean the tool call hasn't been resolved yet. */
const PENDING_TOOL_STATES = new Set([
  "input-streaming",
  "input-available",
  "approval-requested",
  "approval-responded",
]);

function findPendingToolCall(
  messages: UIMessage[],
  toolName: string,
): PendingToolCall | null {
  const part = findLatestPlannerToolPartByState(
    messages,
    toolName,
    PENDING_TOOL_STATES,
  );
  if (!part) return null;

  return {
    toolCallId: part.toolCallId,
    toolName: part.toolName,
    input: part.input,
    ready: part.state === "input-available",
  };
}

function findFinalizedPlan(
  messages: UIMessage[],
): { planId: string } | null {
  const part = findLatestPlannerToolPartByState(
    messages,
    "finalize_plan",
    new Set(["output-available"]),
  );
  if (!part) return null;

  const output = part.output as { planId?: string } | undefined;
  if (output?.planId) return { planId: output.planId };
  return null;
}

function derivePhase(messages: UIMessage[]): Phase {
  if (messages.length === 0) return "initial";
  if (findFinalizedPlan(messages)) return "finalized";
  // Everything else (streaming, pending tools, idle) is "thinking"
  // — the overlays render on top of the thinking canvas
  return "thinking";
}

// ---------------------------------------------------------------------------
// Reasoning -> ThoughtTrace conversion with staggered display
// ---------------------------------------------------------------------------

function collectReasoningText(messages: UIMessage[]): string {
  const chunks: string[] = [];
  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    for (const part of msg.parts) {
      if (part.type === "reasoning") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlanningFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();

  const { messages, sendMessage, addToolOutput, status } = usePlannerChat();

  // Thought display state (staggered reveal)
  const [displayedThoughts, setDisplayedThoughts] = useState<ThoughtTrace[]>(
    [],
  );
  const processedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTimeRef = useRef(0);

  // Derive UI phase
  const phase = derivePhase(messages);
  const pendingQuestions = findPendingToolCall(messages, "ask_questions");
  const pendingCredentials = findPendingToolCall(
    messages,
    "request_credentials",
  );
  const pendingPlan = findPendingToolCall(messages, "propose_plan");
  const finalizedPlan = findFinalizedPlan(messages);
  const latestToolFailure = findLatestPlannerToolFailure(messages, [
    "ask_questions",
    "request_credentials",
    "propose_plan",
    "finalize_plan",
  ]);
  const isStreamBusy = status === "streaming" || status === "submitted";
  const isWaitingForVisibleToolInput =
    pendingQuestions?.ready || pendingCredentials?.ready || pendingPlan?.ready;
  const blockingToolError =
    !isStreamBusy && !isWaitingForVisibleToolInput ? latestToolFailure : null;

  // URL restoration for review page
  const urlPlanId = searchParams.get("planId");
  const urlStep = searchParams.get("step");

  // Track how much reasoning text we've already consumed so we only
  // split *completed* paragraphs (text before the last \n\n break).
  // The trailing text is still streaming and would produce cut-off thoughts.
  const consumedLenRef = useRef(0);
  const pendingThoughtsRef = useRef<string[]>([]);
  const isStreamingRef = useRef(false);
  const debugLogKeyRef = useRef("");

  // Stable drain function — uses only refs and the stable state setter.
  // Named function expression for self-reference in the setTimeout chain.
  const drainQueue = useCallback(function drain() {
    if (pendingThoughtsRef.current.length === 0) {
      timerRef.current = null;
      return;
    }

    const interval = isStreamingRef.current ? 800 : 400;
    const elapsed = Date.now() - lastTimeRef.current;
    const delay =
      lastTimeRef.current > 0 ? Math.max(0, interval - elapsed) : 0;

    timerRef.current = setTimeout(() => {
      const text = pendingThoughtsRef.current.shift();
      if (!text) {
        timerRef.current = null;
        return;
      }

      lastTimeRef.current = Date.now();
      const thoughtIdx = processedRef.current;
      processedRef.current++;

      setDisplayedThoughts((prev) => [
        ...prev,
        { id: `thought-${thoughtIdx}`, text, variant: getRandomVariant() },
      ]);

      drain();
    }, delay);
  }, []);

  // Collect completed paragraphs from reasoning text into the pending queue.
  // NOTE: No cleanup — the drain timer runs independently and must NOT be
  // killed on every re-render (messages updates per-token during streaming).
  useEffect(() => {
    const allText = collectReasoningText(messages);
    const isStreaming = status === "streaming" || status === "submitted";
    isStreamingRef.current = isStreaming;

    const newText = allText.slice(consumedLenRef.current);
    if (!newText) return;

    if (isStreaming) {
      // While streaming, only take completed paragraphs (before the last \n\n).
      const lastBreak = newText.lastIndexOf("\n\n");
      if (lastBreak === -1) return;

      const stable = newText.slice(0, lastBreak);
      consumedLenRef.current += lastBreak + 2;

      const paras = stable
        .split(/\n\n+/)
        .map((p) => p.trim().replace(/\s+/g, " "))
        .filter((p) => p.length > 10);

      pendingThoughtsRef.current.push(...paras);
    } else {
      // Stream finished — flush everything remaining
      consumedLenRef.current = allText.length;

      const paras = newText
        .split(/\n\n+/)
        .map((p) => p.trim().replace(/\s+/g, " "))
        .filter((p) => p.length > 10);

      pendingThoughtsRef.current.push(...paras);
    }

    // Kick off drain loop if not already running
    if (pendingThoughtsRef.current.length > 0 && !timerRef.current) {
      drainQueue();
    }
  }, [messages, status, drainQueue]);

  // Cleanup drain timer on unmount only
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (status === "ready") return;
    if (messages.length === 0) return;
    if (finalizedPlan) return;
    if (isWaitingForVisibleToolInput) return;

    const toolParts = getLastAssistantPlannerToolPartsDebug(messages);
    const logKey = `${status}:${JSON.stringify(toolParts)}`;
    if (logKey === debugLogKeyRef.current) return;
    debugLogKeyRef.current = logKey;

    console.debug("[planner] Streaming without visible pending tool overlay", {
      status,
      toolParts,
      lastMessageId: messages.at(-1)?.id,
    });
  }, [
    messages,
    status,
    finalizedPlan,
    isWaitingForVisibleToolInput,
  ]);

  // Handlers
  const handlePromptSubmit = useCallback(
    (prompt: string, mode: TaskMode) => {
      sendMessage({ text: `[Mode: ${mode}]\n\n${prompt}` });
    },
    [sendMessage],
  );

  const handleQuestionAnswers = useCallback(
    (answers: Record<string, string | string[]>) => {
      if (!pendingQuestions) return;
      addToolOutput({
        tool: "ask_questions",
        toolCallId: pendingQuestions.toolCallId,
        output: answers,
      });
    },
    [addToolOutput, pendingQuestions],
  );

  const handleCredentials = useCallback(
    (result: CredentialsResult) => {
      if (!pendingCredentials) return;
      addToolOutput({
        tool: "request_credentials",
        toolCallId: pendingCredentials.toolCallId,
        output: result,
      });
    },
    [addToolOutput, pendingCredentials],
  );

  const handlePlanApprove = useCallback(() => {
    if (!pendingPlan) return;
    addToolOutput({
      tool: "propose_plan",
      toolCallId: pendingPlan.toolCallId,
      output: { approved: true },
    });
  }, [addToolOutput, pendingPlan]);

  const handlePlanChanges = useCallback(
    (feedback: string) => {
      if (!pendingPlan) return;
      addToolOutput({
        tool: "propose_plan",
        toolCallId: pendingPlan.toolCallId,
        output: { approved: false, feedback },
      });
    },
    [addToolOutput, pendingPlan],
  );

  const handleRecoverFromToolError = useCallback(() => {
    window.location.reload();
  }, []);

  // Direct URL navigation to review
  if (urlStep === "review" && urlPlanId) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex justify-center px-4 py-6">
          <PhaseStepper currentStep="review" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 flex-col py-6"
        >
          <PlanReview
            planId={urlPlanId}
            onBackToChat={() => router.push("/plan")}
          />
        </motion.div>
      </div>
    );
  }

  // Finalized plan -> review
  if (finalizedPlan) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex justify-center px-4 py-6">
          <PhaseStepper currentStep="review" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 flex-col py-6"
        >
          <PlanReview
            planId={finalizedPlan.planId}
            onBackToChat={() => router.push("/plan")}
          />
        </motion.div>
      </div>
    );
  }

  const isThinking = phase === "thinking";

  return (
    <div className="flex flex-1 flex-col">
      {!isThinking && (
        <div className="flex justify-center px-4 py-6">
          <PhaseStepper
            currentStep={phase === "initial" ? "prompt" : "thinking"}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "initial" && (
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

        {isThinking && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex-1"
          >
            <ThinkingCanvas
              thoughts={displayedThoughts}
              isComplete={false}
            />

            {blockingToolError && (
              <ToolErrorOverlay
                toolName={blockingToolError.toolName}
                errorText={blockingToolError.errorText}
                onStartOver={handleRecoverFromToolError}
              />
            )}

            {pendingQuestions?.ready && (
              <QuestionOverlay
                questions={
                  (pendingQuestions.input as AskQuestionsInput).questions
                }
                onSubmit={handleQuestionAnswers}
              />
            )}

            {pendingCredentials?.ready && (
              <CredentialsOverlay
                reason={
                  (pendingCredentials.input as RequestCredentialsInput).reason
                }
                knownUrl={
                  (pendingCredentials.input as RequestCredentialsInput).knownUrl
                }
                onSubmit={handleCredentials}
              />
            )}

            {pendingPlan?.ready && (
              <PlanProposalOverlay
                planMarkdown={
                  (pendingPlan.input as ProposePlanInput).plan
                }
                onApprove={handlePlanApprove}
                onRequestChanges={handlePlanChanges}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolErrorOverlay({
  toolName,
  errorText,
  onStartOver,
}: {
  toolName: string;
  errorText?: string;
  onStartOver: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div className="relative z-10 mx-6 w-full max-w-xl rounded-xl border border-red-500/30 bg-card/95 p-6 shadow-lg">
        <div className="mb-3 flex items-center gap-2 text-red-300">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">Planner tool call failed</p>
        </div>
        <p className="text-sm text-foreground/90">
          The planner failed while running <code>{toolName}</code>. The stream
          cannot continue until this state is reset.
        </p>
        {errorText && (
          <p className="mt-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-100/90">
            {errorText}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={onStartOver} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
}
