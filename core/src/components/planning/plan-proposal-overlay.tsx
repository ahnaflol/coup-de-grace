"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, MessageSquare } from "lucide-react";

interface PlanProposalOverlayProps {
  planMarkdown: string;
  onApprove: () => void;
  onRequestChanges: (feedback: string) => void;
}

export function PlanProposalOverlay({
  planMarkdown,
  onApprove,
  onRequestChanges,
}: PlanProposalOverlayProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  function handleSubmitFeedback() {
    if (feedback.trim()) {
      onRequestChanges(feedback.trim());
    }
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

        {/* Content */}
        <motion.div
          className="relative z-10 w-full max-w-2xl px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-border/30">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
                Proposed Plan
              </span>
            </div>

            {/* Plan content */}
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {planMarkdown}
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-border/30">
              {showFeedback ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Describe what you'd like changed..."
                    className="w-full min-h-[80px] px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none focus:border-primary/30"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFeedback(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitFeedback}
                      disabled={!feedback.trim()}
                    >
                      Send Feedback
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFeedback(true)}
                    className="gap-2"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Request Changes
                  </Button>
                  <Button size="sm" onClick={onApprove} className="gap-2">
                    <Check className="h-3.5 w-3.5" />
                    Approve Plan
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
