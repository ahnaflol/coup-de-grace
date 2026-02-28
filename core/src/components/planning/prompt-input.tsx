"use client";

import { usePlanningStore } from "@/stores/use-planning-store";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { FileDropZone } from "./file-drop-zone";

export function PromptInput() {
  const { prompt, setPrompt, setStep, selectedMode } = usePlanningStore();

  const handleContinue = () => {
    if (prompt.trim()) {
      setStep("chat");
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Describe your task
        </h2>
        <p className="text-muted-foreground">
          Tell us what you want the {selectedMode?.replace("-", " ")} agents to
          do. Be as detailed as possible.
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Test the checkout flow across 5 different user scenarios including guest checkout, registered user, and error states..."
            className="min-h-[160px] resize-none text-base leading-relaxed"
          />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {prompt.length} characters
          </span>
        </div>

        <FileDropZone />

        <div className="flex justify-end">
          <Button
            onClick={handleContinue}
            disabled={!prompt.trim()}
            size="lg"
            className="gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
