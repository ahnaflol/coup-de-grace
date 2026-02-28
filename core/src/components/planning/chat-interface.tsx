"use client";

import { useState, useRef, useEffect } from "react";
import { usePlanningStore } from "@/stores/use-planning-store";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { MOCK_CHAT_MESSAGES, MOCK_PLAN_STEPS } from "@/lib/mock-data";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Loader2 } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types";

export function ChatInterface() {
  const { chatMessages, addChatMessage, setStep, setPlanSteps } =
    usePlanningStore();
  const [isTyping, setIsTyping] = useState(false);
  const hasInitialized = useRef(false);
  const scrollTrigger = chatMessages.length + (isTyping ? 1 : 0);
  const scrollRef = useAutoScroll<HTMLDivElement>(scrollTrigger);

  useEffect(() => {
    if (!hasInitialized.current && chatMessages.length === 0) {
      hasInitialized.current = true;
      MOCK_CHAT_MESSAGES.forEach((msg) => addChatMessage(msg));
    }
  }, [chatMessages.length, addChatMessage]);

  const handleSend = (content: string) => {
    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    addChatMessage(userMessage);

    setIsTyping(true);
    setTimeout(() => {
      const assistantMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "I've updated the plan based on your feedback. The execution will now include the additional requirements. You can review the final plan when ready.",
        timestamp: new Date(),
      };
      addChatMessage(assistantMessage);
      setIsTyping(false);
    }, 1500);
  };

  const handleProceedToReview = () => {
    setPlanSteps(MOCK_PLAN_STEPS);
    setStep("review");
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 h-[calc(100vh-13rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Refine your plan</h2>
          <p className="text-sm text-muted-foreground">
            Chat with the AI to fine-tune agent tasks.
          </p>
        </div>
        <Button onClick={handleProceedToReview} variant="outline" className="gap-2">
          Review Plan
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 rounded-lg border bg-card p-4">
        <div ref={scrollRef} className="space-y-4">
          {chatMessages.map((msg) => (
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

      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
