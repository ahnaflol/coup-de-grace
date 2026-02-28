"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, CheckCircle, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/planning/chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getOutputPlannerToolParts } from "@/lib/planner-tool-parts";
import type { UIMessage } from "ai";

interface PlanConversationProps {
  messages: UIMessage[];
  onSend: (text: string) => void;
  onApprove: () => void;
  isStreaming: boolean;
}

function getToolSummary(toolName: string, input: unknown): string {
  switch (toolName) {
    case "ask_questions": {
      const data = input as { questions?: unknown[] } | undefined;
      const count = data?.questions?.length ?? 0;
      return `Answered ${count} question${count === 1 ? "" : "s"}`;
    }
    case "request_credentials":
      return "Provided credentials";
    case "finalize_plan":
      return "Plan finalized";
    default:
      return `Tool: ${toolName}`;
  }
}

export function PlanConversation({
  messages,
  onSend,
  onApprove,
  isStreaming,
}: PlanConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, isStreaming]);

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4 px-4">
      {/* Message area */}
      <ScrollArea className="flex-1 rounded-lg border border-border/60 bg-card/30 p-4">
        <div ref={scrollRef} className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {message.role === "user" && (
                  <UserBubble parts={message.parts} />
                )}
                {message.role === "assistant" && (
                  <AssistantBubble parts={message.parts} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isStreaming && (
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-muted px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom controls */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <ChatInput onSend={onSend} disabled={isStreaming} />
        </div>
        <Button onClick={onApprove} className="gap-2 shrink-0" size="lg">
          Approve Plan
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function UserBubble({ parts }: { parts: UIMessage["parts"] }) {
  const textContent = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");

  if (!textContent) return null;

  return (
    <div className="flex flex-row-reverse gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <User className="h-4 w-4" />
      </div>
      <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
        <p className="whitespace-pre-wrap">{textContent}</p>
      </div>
    </div>
  );
}

function AssistantBubble({ parts }: { parts: UIMessage["parts"] }) {
  const textParts = parts.filter((p) => p.type === "text");
  const toolParts = getOutputPlannerToolParts(parts);

  return (
    <div className="space-y-2">
      {/* Tool result summaries */}
      {toolParts.map((part) => {
        return (
          <div key={part.toolCallId} className="flex gap-3">
            <div className="w-8" />
            <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              {getToolSummary(part.toolName, part.input)}
            </div>
          </div>
        );
      })}

      {/* Text content as markdown */}
      {textParts.map((part, i) => {
        if (part.type !== "text" || !part.text.trim()) return null;
        return (
          <div key={i} className="flex gap-3">
            {i === 0 ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
            ) : (
              <div className="w-8" />
            )}
            <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-2.5 text-sm leading-relaxed text-foreground">
              <MarkdownContent content={part.text} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-3 mt-4 text-lg font-bold first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-3 text-base font-semibold first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-3 text-sm font-semibold first:mt-0">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-2 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code
                className={cn(
                  "block overflow-x-auto rounded-md bg-black/80 p-3 font-mono text-xs text-gray-200",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className="rounded bg-black/20 px-1 py-0.5 font-mono text-xs"
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-2 last:mb-0">{children}</pre>
        ),
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-border/60 bg-muted/50">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="[&>tr:nth-child(even)]:bg-muted/30">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="border-b border-border/30">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-2 py-1.5 text-left font-medium">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-2 py-1.5">{children}</td>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-primary underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-primary/30 pl-3 italic text-muted-foreground last:mb-0">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-border/40" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
