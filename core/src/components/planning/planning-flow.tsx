"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";
import { PhaseStepper } from "@/components/layout/phase-stepper";
import { THOUGHT_VARIANTS } from "@/lib/constants";
import type { TaskMode } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { isRecord } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
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
  state: string;
  ready: boolean; // true when input is fully available (not still streaming)
}

/** States that mean the tool call hasn't been resolved yet. */
const PENDING_TOOL_STATES = new Set([
  "input-streaming",
  "input-available",
  "approval-requested",
  "approval-responded",
]);
const STALLED_TOOL_TIMEOUT_MS = 10_000;

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
    state: part.state,
    ready: part.state === "input-available",
  };
}

function derivePhase(messages: UIMessage[]): Phase {
  if (messages.length === 0) return "initial";
  // Everything else (streaming, pending tools, idle) is "thinking"
  // — the overlays render on top of the thinking canvas
  return "thinking";
}

// ---------------------------------------------------------------------------
// Reasoning -> ThoughtTrace conversion with staggered display
// ---------------------------------------------------------------------------

function collectThinkingText(messages: UIMessage[]): string {
  const reasoningChunks: string[] = [];
  const fallbackTextChunks: string[] = [];

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    for (const part of msg.parts) {
      if (part.type === "reasoning") {
        reasoningChunks.push(part.text);
      } else if (part.type === "text") {
        fallbackTextChunks.push(part.text);
      }
    }
  }

  return reasoningChunks.length > 0
    ? reasoningChunks.join("")
    : fallbackTextChunks.join("\n\n");
}

function getLatestAssistantMessageText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n\n")
      .trim();
  }

  return "";
}

function getPlanMarkdownFromProposeInput(
  input: ProposePlanInput | undefined,
  latestAssistantText: string,
): string {
  const structuredPlan =
    isRecord(input?.structuredPlan) ? input.structuredPlan : null;
  const markdownFromStructured =
    structuredPlan && typeof structuredPlan.planMarkdown === "string"
      ? structuredPlan.planMarkdown
      : undefined;

  return (
    (input?.planMarkdown ??
      input?.plan ??
      markdownFromStructured ??
      latestAssistantText) ||
    ""
  ).trim();
}

function getStableThoughtCutoff(text: string): number {
  const paragraphBreak = text.lastIndexOf("\n\n");
  const sentenceBoundaryMatch = text.match(/[\s\S]*[.!?](?=\s|$)/);
  const sentenceBreak = sentenceBoundaryMatch
    ? sentenceBoundaryMatch[0].length
    : -1;

  return Math.max(paragraphBreak === -1 ? -1 : paragraphBreak + 2, sentenceBreak);
}

function extractThoughts(text: string): string[] {
  return text
    .split(/\n\n+|(?<=[.!?])\s+/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter((p) => p.length > 20);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlanningFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    messages,
    sendMessage,
    addToolOutput,
    regenerate,
    resumeStream,
    status,
  } = usePlannerChat();
  const finalizeAndLaunchMutation = trpc.plan.finalizeAndLaunch.useMutation();
  const retryLaunchMutation = trpc.execution.start.useMutation();
  const [stalledPendingTool, setStalledPendingTool] = useState<{
    toolCallId: string;
    toolName: string;
    state: string;
  } | null>(null);
  const [launchFailure, setLaunchFailure] = useState<{
    planId: string;
    message: string;
  } | null>(null);

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
  const latestToolFailure = findLatestPlannerToolFailure(messages, [
    "ask_questions",
    "request_credentials",
    "propose_plan",
  ]);
  const isStreamBusy = status === "streaming" || status === "submitted";
  const isWaitingForVisibleToolInput =
    pendingQuestions?.ready || pendingCredentials?.ready || pendingPlan?.ready;
  const nonReadyPendingTool =
    (pendingPlan && !pendingPlan.ready && pendingPlan) ||
    (pendingCredentials && !pendingCredentials.ready && pendingCredentials) ||
    (pendingQuestions && !pendingQuestions.ready && pendingQuestions) ||
    null;
  const nonReadyPendingToolCallId = nonReadyPendingTool?.toolCallId;
  const nonReadyPendingToolName = nonReadyPendingTool?.toolName;
  const nonReadyPendingToolState = nonReadyPendingTool?.state;
  const latestAssistantText = getLatestAssistantMessageText(messages);
  const pendingPlanInput = pendingPlan?.input as ProposePlanInput | undefined;
  const pendingPlanMarkdown = getPlanMarkdownFromProposeInput(
    pendingPlanInput,
    latestAssistantText,
  );
  const canShowPlanProposal = Boolean(pendingPlan && pendingPlanMarkdown.length > 0);
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
  const seededThinkingRef = useRef(false);

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

  const queueSyntheticThought = useCallback(
    (text: string) => {
      pendingThoughtsRef.current.push(text);
      if (!timerRef.current) {
        drainQueue();
      }
    },
    [drainQueue],
  );

  // Collect completed paragraphs from reasoning text into the pending queue.
  // NOTE: No cleanup — the drain timer runs independently and must NOT be
  // killed on every re-render (messages updates per-token during streaming).
  useEffect(() => {
    const allText = collectThinkingText(messages);
    const isStreaming = status === "streaming" || status === "submitted";
    isStreamingRef.current = isStreaming;

    const newText = allText.slice(consumedLenRef.current);
    if (!newText) return;

    if (isStreaming) {
      // While streaming, emit complete paragraphs or sentence-level chunks.
      const cutoff = getStableThoughtCutoff(newText);
      if (cutoff <= 0) return;

      const stable = newText.slice(0, cutoff);
      consumedLenRef.current += cutoff;
      pendingThoughtsRef.current.push(...extractThoughts(stable));
    } else {
      // Stream finished — flush everything remaining
      consumedLenRef.current = allText.length;
      pendingThoughtsRef.current.push(...extractThoughts(newText));
    }

    // Kick off drain loop if not already running
    if (pendingThoughtsRef.current.length > 0 && !timerRef.current) {
      drainQueue();
    }
  }, [messages, status, drainQueue]);

  useEffect(() => {
    if (!isStreamBusy) {
      seededThinkingRef.current = false;
      return;
    }

    if (seededThinkingRef.current) return;
    if (displayedThoughts.length > 0) return;
    if (pendingThoughtsRef.current.length > 0) return;

    seededThinkingRef.current = true;
    queueSyntheticThought(
      "Analyzing your request and preparing the next planning step.",
    );
  }, [isStreamBusy, displayedThoughts.length, queueSyntheticThought]);

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
    isWaitingForVisibleToolInput,
  ]);

  useEffect(() => {
    if (
      isStreamBusy ||
      blockingToolError ||
      !nonReadyPendingToolCallId ||
      !nonReadyPendingToolName ||
      !nonReadyPendingToolState
    ) {
      setStalledPendingTool(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setStalledPendingTool({
        toolCallId: nonReadyPendingToolCallId,
        toolName: nonReadyPendingToolName,
        state: nonReadyPendingToolState,
      });

      if (process.env.NODE_ENV !== "production") {
        console.warn("[planner] Detected stalled pending tool call", {
          toolCallId: nonReadyPendingToolCallId,
          toolName: nonReadyPendingToolName,
          state: nonReadyPendingToolState,
        });
      }
    }, STALLED_TOOL_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [
    isStreamBusy,
    blockingToolError,
    nonReadyPendingToolCallId,
    nonReadyPendingToolName,
    nonReadyPendingToolState,
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
      queueSyntheticThought(
        "Reviewing your answers and deciding the most relevant follow-up questions.",
      );
      addToolOutput({
        tool: "ask_questions",
        toolCallId: pendingQuestions.toolCallId,
        output: answers,
      });
    },
    [addToolOutput, pendingQuestions, queueSyntheticThought],
  );

  const handleCredentials = useCallback(
    (result: CredentialsResult) => {
      if (!pendingCredentials) return;
      queueSyntheticThought(
        "Analyzing access details and preparing the next planning step.",
      );
      addToolOutput({
        tool: "request_credentials",
        toolCallId: pendingCredentials.toolCallId,
        output: result,
      });
    },
    [addToolOutput, pendingCredentials, queueSyntheticThought],
  );

  const handlePlanApprove = useCallback(async () => {
    if (!pendingPlan) return;
    setLaunchFailure(null);
    queueSyntheticThought(
      "Finalizing your plan and launching agents.",
    );

    try {
      const input = pendingPlan.input as ProposePlanInput | undefined;
      const planMarkdown = getPlanMarkdownFromProposeInput(
        input,
        getLatestAssistantMessageText(messages),
      );
      const rawStructured = input?.structuredPlan;
      const assistantTextFallback = latestAssistantText;

      if (!planMarkdown && !rawStructured && !assistantTextFallback) {
        throw new Error(
          "Planner did not provide plan data for review.",
        );
      }

      // Extract user prompt and mode from first user message
      const firstUserMessage = messages.find((m) => m.role === "user");
      const firstUserText = firstUserMessage
        ? firstUserMessage.parts
            .filter(
              (p): p is { type: "text"; text: string } => p.type === "text",
            )
            .map((p) => p.text)
            .join("\n")
        : "";

      const modeMatch = firstUserText.match(/\[Mode:\s*(.+?)\]/);
      const parsedMode = modeMatch?.[1];
      const mode: "testing" | "data-migration" | "data-entry" =
        parsedMode === "testing" ||
        parsedMode === "data-migration" ||
        parsedMode === "data-entry"
          ? parsedMode
          : "testing";

      // Remove the [Mode: ...] prefix from the user prompt
      const userPrompt = firstUserText.replace(/\[Mode:\s*.+?\]\s*/, "").trim();

      const result = await finalizeAndLaunchMutation.mutateAsync({
        planMarkdown: planMarkdown || undefined,
        structuredPlan: rawStructured,
        assistantTextFallback: assistantTextFallback || undefined,
        userPrompt,
        mode,
      });

      if (result.started) {
        router.push(`/execute?planId=${encodeURIComponent(result.planId)}`);
        return;
      }

      setLaunchFailure({
        planId: result.planId,
        message:
          result.error ??
          "Plan saved, but launching agents failed. Retry launch to continue.",
      });
      queueSyntheticThought(
        "Plan saved, but launch failed. Use retry launch to continue.",
      );
    } catch (err) {
      console.error("[planner] Failed to finalize and launch plan:", err);
      queueSyntheticThought(
        "Something went wrong while launching. Please retry.",
      );
    }
  }, [
    pendingPlan,
    messages,
    latestAssistantText,
    finalizeAndLaunchMutation,
    router,
    queueSyntheticThought,
  ]);

  const handleRetryLaunch = useCallback(async () => {
    if (!launchFailure) return;

    queueSyntheticThought("Retrying execution launch for the saved plan.");

    try {
      const result = await retryLaunchMutation.mutateAsync({
        planId: launchFailure.planId,
      });
      if (result.started) {
        setLaunchFailure(null);
        router.push(`/execute?planId=${encodeURIComponent(launchFailure.planId)}`);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Retry failed. Please try again.";
      setLaunchFailure((current) =>
        current ? { ...current, message } : current,
      );
      queueSyntheticThought(
        "Launch retry failed. You can retry again or start over.",
      );
    }
  }, [launchFailure, retryLaunchMutation, queueSyntheticThought, router]);

  const handlePlanChanges = useCallback(
    (feedback: string) => {
      if (!pendingPlan) return;
      queueSyntheticThought(
        "Incorporating your feedback and refining task-level instructions.",
      );
      addToolOutput({
        tool: "propose_plan",
        toolCallId: pendingPlan.toolCallId,
        output: { approved: false, feedback },
      });
    },
    [addToolOutput, pendingPlan, queueSyntheticThought],
  );

  const handleRecoverFromToolError = useCallback(() => {
    window.location.reload();
  }, []);

  const handleRetryPlannerTurn = useCallback(() => {
    if (stalledPendingTool?.toolName === "propose_plan") {
      queueSyntheticThought(
        "Retrying final proposal with compact tool input so the plan can be reviewed.",
      );
      sendMessage({
        text:
          "Retry the final proposal now. Write the full plan markdown in assistant text, then call propose_plan with summary, taskCount, and structuredPlan (including planMarkdown).",
      });
      return;
    }

    queueSyntheticThought(
      "Retrying the planning step to continue toward the final plan proposal.",
    );
    void (async () => {
      await resumeStream();
      setTimeout(() => {
        void regenerate();
      }, 900);
    })();
  }, [
    stalledPendingTool?.toolName,
    queueSyntheticThought,
    sendMessage,
    regenerate,
    resumeStream,
  ]);

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

            {launchFailure && (
              <LaunchFailureOverlay
                message={launchFailure.message}
                isRetrying={retryLaunchMutation.isPending}
                onRetry={handleRetryLaunch}
                onStartOver={handleRecoverFromToolError}
              />
            )}

            {stalledPendingTool && !canShowPlanProposal && (
              <StalledToolOverlay
                toolName={stalledPendingTool.toolName}
                toolState={stalledPendingTool.state}
                onRetry={handleRetryPlannerTurn}
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

            {canShowPlanProposal && !launchFailure && (
              <PlanProposalOverlay
                planMarkdown={pendingPlanMarkdown}
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

function LaunchFailureOverlay({
  message,
  isRetrying,
  onRetry,
  onStartOver,
}: {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
  onStartOver: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div className="relative z-10 mx-6 w-full max-w-xl rounded-xl border border-amber-500/30 bg-card/95 p-6 shadow-lg">
        <div className="mb-3 flex items-center gap-2 text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">Execution launch failed</p>
        </div>
        <p className="text-sm text-foreground/90">
          The plan was saved, but execution did not start.
        </p>
        <p className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-100/90">
          {message}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onRetry}
            disabled={isRetrying}
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {isRetrying ? "Retrying..." : "Retry Launch"}
          </Button>
          <Button onClick={onStartOver} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
}

function StalledToolOverlay({
  toolName,
  toolState,
  onRetry,
  onStartOver,
}: {
  toolName: string;
  toolState: string;
  onRetry: () => void;
  onStartOver: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div className="relative z-10 mx-6 w-full max-w-xl rounded-xl border border-amber-500/30 bg-card/95 p-6 shadow-lg">
        <div className="mb-3 flex items-center gap-2 text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">Planner appears stalled</p>
        </div>
        <p className="text-sm text-foreground/90">
          The planner is waiting on <code>{toolName}</code> but the tool input
          never became usable. This usually happens when a tool payload was left
          incomplete.
        </p>
        <p className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-100/90">
          Current state: {toolState}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Planner Turn
          </Button>
          <Button onClick={onStartOver} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
}
