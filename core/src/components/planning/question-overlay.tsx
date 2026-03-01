"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InterviewQuestion } from "@/components/planning/interview-question";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterviewQuestion as InterviewQuestionType } from "@/types";

interface QuestionOverlayProps {
  questions: InterviewQuestionType[];
  onSubmit: (answers: Record<string, string | string[]>) => void;
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

function getTabClassName(isActive: boolean, isAnswered: boolean): string {
  const base =
    "relative flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200";

  if (isActive) return cn(base, "bg-primary/10 text-primary");
  if (isAnswered)
    return cn(
      base,
      "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    );
  return cn(
    base,
    "text-muted-foreground/60 hover:bg-muted/40 hover:text-muted-foreground",
  );
}

function getBadgeClassName(isActive: boolean, isAnswered: boolean): string {
  const base =
    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors";

  if (isActive) return cn(base, "bg-primary text-primary-foreground");
  if (isAnswered) return cn(base, "bg-primary/20 text-primary");
  return cn(base, "bg-muted text-muted-foreground/60");
}

export function QuestionOverlay({ questions, onSubmit }: QuestionOverlayProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const allAnswered = questions.every((q) => answers[q.id] != null);
  const activeQuestion = questions[activeIndex];

  function goTo(index: number): void {
    if (index < 0 || index >= questions.length || index === activeIndex) return;
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  }

  function goNext(): void {
    goTo(activeIndex + 1);
  }

  function goPrev(): void {
    goTo(activeIndex - 1);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= questions.length) {
          e.preventDefault();
          goTo(num - 1);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleAnswer(questionId: string, answer: string | string[]): void {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    // Auto-advance to next unanswered question after a short delay
    const updatedAnswers = { ...answers, [questionId]: answer };
    setTimeout(() => {
      const nextUnanswered = questions.findIndex(
        (q, i) => i > activeIndex && updatedAnswers[q.id] == null,
      );
      if (nextUnanswered !== -1) {
        setDirection(1);
        setActiveIndex(nextUnanswered);
      }
    }, 300);
  }

  function handleSubmit(): void {
    if (!allAnswered) return;
    onSubmit(answers);
  }

  if (questions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Container with ripple clip-path */}
        <motion.div
          className="relative z-10 w-full max-w-2xl px-6"
          initial={{ clipPath: "circle(0% at 50% 50%)" }}
          animate={{ clipPath: "circle(75% at 50% 50%)" }}
          exit={{ clipPath: "circle(0% at 50% 50%)" }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <motion.div
            className="overflow-hidden rounded-xl border border-border/60 bg-card/95 backdrop-blur-md"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.05, 1] }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {/* Tab bar */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-border/30 px-5 py-3">
              {questions.map((q, i) => {
                const isActive = i === activeIndex;
                const isAnswered = answers[q.id] != null;

                return (
                  <button
                    key={q.id}
                    onClick={() => goTo(i)}
                    className={getTabClassName(isActive, isAnswered)}
                  >
                    <span className={getBadgeClassName(isActive, isAnswered)}>
                      {isAnswered && !isActive ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="max-w-[120px] truncate">
                      {q.question}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Question content */}
            <div className="relative overflow-hidden px-5 py-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeQuestion.id}
                  initial={{ x: direction * 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction * -40, opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  <InterviewQuestion
                    question={activeQuestion}
                    isAnswered={answers[activeQuestion.id] != null}
                    onAnswer={(answer) =>
                      handleAnswer(activeQuestion.id, answer)
                    }
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/30 px-5 py-3">
              <span className="text-xs text-muted-foreground/60">
                {activeIndex + 1} of {questions.length}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={goPrev}
                  disabled={activeIndex === 0}
                  aria-label="Previous question"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={goNext}
                  disabled={activeIndex === questions.length - 1}
                  aria-label="Next question"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  size="sm"
                  className="ml-2 gap-2"
                >
                  Confirm
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
