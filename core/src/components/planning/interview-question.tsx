"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InterviewQuestion as InterviewQuestionType } from "@/types";

interface InterviewQuestionProps {
  question: InterviewQuestionType;
  onAnswer: (answer: string | string[]) => void;
  isAnswered: boolean;
}

export function InterviewQuestion({
  question,
  onAnswer,
  isAnswered,
}: InterviewQuestionProps) {
  const [selected, setSelected] = useState<string | string[] | null>(null);
  const [customInput, setCustomInput] = useState("");

  function handleSelect(value: string) {
    if (isAnswered) return;

    if (question.type === "multi-select") {
      const current = Array.isArray(selected) ? selected : [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setSelected(updated);
    } else {
      setSelected(value);
      onAnswer(value);
    }
  }

  function handleMultiSelectConfirm() {
    if (Array.isArray(selected) && selected.length > 0) {
      onAnswer(selected);
    }
  }

  function handleCustomSubmit() {
    if (!customInput.trim() || isAnswered) return;
    onAnswer(customInput.trim());
  }

  function getAnsweredValue(): string | null {
    if (!isAnswered) return null;
    if (Array.isArray(selected)) return selected.join(", ");
    if (typeof selected === "string") return selected;
    return customInput;
  }

  const answeredValue = getAnsweredValue();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group"
    >
      <div
        className={cn(
          "relative rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-500",
          isAnswered
            ? "border-primary/20 bg-primary/[0.02]"
            : "hover:border-primary/30 hover:bg-card/80"
        )}
      >
        {/* Top edge accent line */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-px transition-colors duration-500",
            isAnswered ? "bg-primary/30" : "bg-border/40 group-hover:bg-primary/20"
          )}
        />

        <div className="px-5 py-4">
          {/* Question text */}
          <p
            className={cn(
              "text-sm leading-relaxed transition-colors duration-300",
              isAnswered ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {question.question}
          </p>

          {/* Answer area */}
          {!isAnswered ? (
            <div className="mt-4 space-y-3">
              {/* Select options */}
              {question.type === "select" && question.options && (
                <div className="grid gap-1.5">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "group/opt flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-all duration-200",
                        selected === option
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all",
                          selected === option
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30 group-hover/opt:border-muted-foreground/50"
                        )}
                      >
                        {selected === option && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Multi-select chips */}
              {question.type === "multi-select" && question.options && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {question.options.map((option) => {
                      const isActive =
                        Array.isArray(selected) && selected.includes(option);
                      return (
                        <button
                          key={option}
                          onClick={() => handleSelect(option)}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                            isActive
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {Array.isArray(selected) && selected.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Button
                        size="sm"
                        onClick={handleMultiSelectConfirm}
                        className="gap-1.5"
                      >
                        Confirm
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Toggle */}
              {question.type === "toggle" && (
                <div className="flex gap-2">
                  {["Yes", "No"].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "rounded-md border px-5 py-2 text-sm font-medium transition-all duration-200",
                        selected === option
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Text input */}
              {question.type === "text" && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={question.placeholder ?? "Type your answer..."}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCustomSubmit();
                    }}
                    className="h-9 border-border/60 bg-transparent text-sm placeholder:text-muted-foreground/50"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCustomSubmit}
                    disabled={!customInput.trim()}
                    className="shrink-0 gap-1 text-xs text-muted-foreground"
                  >
                    <CornerDownLeft className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Custom answer fallback for non-text types */}
              {question.type !== "text" && (
                <div className="flex items-center gap-2 border-t border-border/30 pt-3">
                  <Input
                    placeholder="or type a custom answer..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCustomSubmit();
                    }}
                    className="h-7 border-border/40 bg-transparent text-xs placeholder:text-muted-foreground/40"
                  />
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleCustomSubmit}
                    disabled={!customInput.trim()}
                    className="shrink-0 text-muted-foreground/60"
                  >
                    <CornerDownLeft className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Answered state */
            <div className="mt-2 flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-xs text-primary/60 font-medium">
                {answeredValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
