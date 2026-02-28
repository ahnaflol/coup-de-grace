"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewQuestion } from "@/components/planning/interview-question";
import { CredentialsCard } from "@/components/planning/credentials-card";
import type { Credentials, InterviewQuestion as InterviewQuestionType } from "@/types";

interface InterviewFlowProps {
  questions: InterviewQuestionType[];
  onComplete: (
    answers: Record<string, string | string[]>,
    credentials: Credentials
  ) => void;
}

export function InterviewFlow({ questions, onComplete }: InterviewFlowProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [credentials, setCredentials] = useState<Credentials>({
    url: "",
    username: "",
    password: "",
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  const visibleQuestions = questions.slice(0, currentIndex + 1);
  const allQuestionsAnswered = questions.every((q) => answers[q.id] != null);
  const credentialsFilled =
    credentials.url.trim() !== "" &&
    credentials.username.trim() !== "" &&
    credentials.password.trim() !== "";
  const canGenerate = allQuestionsAnswered && credentialsFilled;

  const handleAnswer = useCallback(
    (questionId: string, answer: string | string[]) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));

      if (currentIndex < questions.length - 1) {
        setTimeout(() => setCurrentIndex((i) => i + 1), 300);
      }

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, currentIndex < questions.length - 1 ? 400 : 100);
    },
    [currentIndex, questions.length]
  );

  const handleCredentialsChange = useCallback(
    (partial: Partial<Credentials>) => {
      setCredentials((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  function handleGenerate() {
    if (!canGenerate) return;
    onComplete(answers, credentials);
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mx-auto w-full max-w-xl px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex items-end justify-between"
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Configure your run
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            {answeredCount} of {questions.length} answered
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {questions.map((q, i) => {
            let dotStyle = "w-1.5 bg-border";
            if (answers[q.id] != null) {
              dotStyle = "w-5 bg-primary/60";
            } else if (i === currentIndex) {
              dotStyle = "w-3 bg-primary/30";
            }

            return (
              <div
                key={q.id}
                className={`h-1 rounded-full transition-all duration-500 ${dotStyle}`}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Questions */}
      <div className="space-y-3">
        <AnimatePresence mode="sync">
          {visibleQuestions.map((question, i) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: i === currentIndex ? 0.15 : 0,
              }}
            >
              <InterviewQuestion
                question={question}
                isAnswered={answers[question.id] != null}
                onAnswer={(answer) => handleAnswer(question.id, answer)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Credentials */}
        {allQuestionsAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CredentialsCard
              credentials={credentials}
              onChange={handleCredentialsChange}
            />
          </motion.div>
        )}

        {/* Generate button */}
        {allQuestionsAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end pt-2"
          >
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              size="lg"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Plan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
