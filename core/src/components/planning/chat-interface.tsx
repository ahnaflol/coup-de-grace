"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import type { ChatMessage as ChatMessageType } from "@/types";
import type { Plan } from "@/server/schemas";

interface ChatInterfaceProps {
  planId?: string;
  onAccept: () => void;
}

function buildPromptUrl() {
  const search = new URLSearchParams();
  search.set("step", "prompt");
  return `/plan?${search.toString()}`;
}

function PlanProposalCard({ plan }: { plan: Plan }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Current plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-semibold">{plan.title}</p>
          <p className="text-xs text-muted-foreground">
            {plan.tasks.length} task{plan.tasks.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="space-y-2">
          {plan.tasks.map((t, idx) => (
            <div key={`${t.title}-${idx}`} className="rounded-lg border p-3">
              <p className="text-sm font-medium">
                {idx + 1}. {t.title}
              </p>
              {t.startUrl && (
                <p className="mt-1 text-xs text-muted-foreground">
                  URL: {t.startUrl}
                </p>
              )}
              {t.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.description}
                </p>
              )}
              <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                {t.instruction}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ChatInterface({ planId, onAccept }: ChatInterfaceProps) {
  const router = useRouter();
  const planQuery = trpc.plan.get.useQuery(
    { planId: planId ?? "" },
    { enabled: Boolean(planId) },
  );
  const requestChanges = trpc.plan.requestChanges.useMutation();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const hasSeeded = useRef(false);

  useEffect(() => {
    if (!planQuery.data || hasSeeded.current) return;
    hasSeeded.current = true;

    setPlan(planQuery.data.parsed);

    const seed: ChatMessageType[] = [
      {
        id: crypto.randomUUID(),
        role: "user",
        content: planQuery.data.userPrompt,
        timestamp: new Date(),
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Here’s a draft plan. Tell me what you want to change and I’ll update it.",
        timestamp: new Date(),
      },
    ];
    setMessages(seed);
  }, [planQuery.data]);

  const scrollTrigger = messages.length + (isTyping ? 1 : 0);
  const scrollRef = useAutoScroll<HTMLDivElement>(scrollTrigger);

  const canAccept = useMemo(() => Boolean(planId && plan), [planId, plan]);

  const handleSend = async (content: string) => {
    if (!planId) return;

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsTyping(true);
    try {
      const updated = await requestChanges.mutateAsync({
        planId,
        feedback: content,
      });
      setPlan(updated.parsed);

      const assistantMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Updated the plan. Anything else you’d like to adjust?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update plan";
      toast.error(message);
      const assistantMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `I couldn't update the plan: ${message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!planId) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4">
        <h2 className="text-lg font-semibold">Refine your plan</h2>
        <p className="text-sm text-muted-foreground">
          No plan selected. Generate a plan first.
        </p>
        <Button onClick={() => router.push(buildPromptUrl())} variant="outline">
          Back to prompt
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Refine your plan</h2>
          <p className="text-sm text-muted-foreground">
            Chat with the assistant to fine-tune your tasks.
          </p>
        </div>
        <Button onClick={onAccept} disabled={!canAccept} className="gap-2">
          Accept plan
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {planQuery.isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading plan…
        </div>
      )}

      {plan && <PlanProposalCard plan={plan} />}

      <ScrollArea className="h-[calc(100vh-28rem)] rounded-lg border bg-card p-4">
        <div ref={scrollRef} className="space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl bg-muted px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <ChatInput
        onSend={handleSend}
        disabled={isTyping || requestChanges.isPending}
      />
    </div>
  );
}
