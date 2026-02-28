"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function PromptInput() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const sendMessage = trpc.chat.sendMessage.useMutation();

  const handleGeneratePlan = async () => {
    const message = prompt.trim();
    if (!message || sendMessage.isPending) return;
    try {
      const result = await sendMessage.mutateAsync({ message });
      const search = new URLSearchParams();
      search.set("step", "chat");
      search.set("planId", result.plan.id);
      search.set("sessionId", result.sessionId);
      router.push(`/plan?${search.toString()}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate plan";
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Describe your testing task
        </h2>
        <p className="text-muted-foreground">
          Tell us what you want to test. Be as detailed as possible.
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

        <div className="flex justify-end">
          <Button
            onClick={handleGeneratePlan}
            disabled={!prompt.trim() || sendMessage.isPending}
            size="lg"
            className="gap-2"
          >
            {sendMessage.isPending ? (
              <>
                Generating
                <Loader2 className="h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                Generate plan
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
