"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InterviewQuestion } from "@/components/planning/interview-question";
import { ChevronRight } from "lucide-react";
import type { InterviewQuestion as InterviewQuestionType } from "@/types";

interface QuestionOverlayProps {
  questions: InterviewQuestionType[];
  onSubmit: (answers: Record<string, string | string[]>) => void;
}

export function QuestionOverlay({ questions, onSubmit }: QuestionOverlayProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const allAnswered = questions.every((q) => answers[q.id] != null);

  function handleAnswer(questionId: string, answer: string | string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  function handleSubmit() {
    if (!allAnswered) return;
    onSubmit(answers);
  }

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
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Container with ripple clip-path */}
        <motion.div
          className="relative z-10 w-full max-w-lg px-6"
          initial={{ clipPath: "circle(0% at 50% 50%)" }}
          animate={{ clipPath: "circle(75% at 50% 50%)" }}
          exit={{ clipPath: "circle(0% at 50% 50%)" }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="space-y-3">
            {questions.map((question, i) => (
              <motion.div
                key={question.id}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.05, 1] }}
                exit={{ scale: 0 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <InterviewQuestion
                  question={question}
                  isAnswered={answers[question.id] != null}
                  onAnswer={(answer) => handleAnswer(question.id, answer)}
                />
              </motion.div>
            ))}

            {/* Submit button */}
            <motion.div
              className="flex justify-end pt-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: questions.length * 0.1 + 0.2 }}
            >
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="gap-2"
              >
                Confirm
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
