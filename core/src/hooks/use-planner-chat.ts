"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";

export type AskQuestionsInput = {
  questions: Array<{
    id: string;
    question: string;
    type: "select" | "multi-select" | "toggle" | "text";
    options?: string[];
    placeholder?: string;
  }>;
};

export type RequestCredentialsInput = {
  reason: string;
  knownUrl?: string;
};

export type CredentialsResult = {
  url: string;
  requiresLogin: boolean;
  username?: string;
  password?: string;
};

export type ProposePlanInput = {
  plan: string;
};

export type ProposePlanResult = {
  approved: boolean;
  feedback?: string;
};

export type FinalizePlanResult = {
  planId: string;
  success: boolean;
};

const transport = new DefaultChatTransport({
  api: "/api/plan/chat",
});

export function usePlannerChat() {
  return useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });
}
