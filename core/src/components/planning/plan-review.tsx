"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PlanReviewProps {
  planId?: string;
  sessionId?: string;
  onBackToChat: () => void;
}

export function PlanReview({ planId, onBackToChat }: PlanReviewProps) {
  const router = useRouter();
  const planQuery = trpc.plan.get.useQuery(
    { planId: planId ?? "" },
    { enabled: Boolean(planId) }
  );
  const approve = trpc.plan.approve.useMutation();
  const startExecution = trpc.execution.start.useMutation();

  const handleApproveAndLaunch = async () => {
    if (!planId) return;
    try {
      await approve.mutateAsync({ planId });
      await startExecution.mutateAsync({ planId });
      toast.success("Approved. Launching agents…");
      router.push(`/execute?planId=${encodeURIComponent(planId)}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start execution";
      toast.error(message);
    }
  };

  if (!planId) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4">
        <h2 className="text-2xl font-semibold tracking-tight">Review plan</h2>
        <p className="text-sm text-muted-foreground">
          No plan selected. Generate a plan first.
        </p>
        <Button variant="outline" onClick={onBackToChat}>
          Back
        </Button>
      </div>
    );
  }

  const parsed = planQuery.data?.parsed;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Review plan</h2>
          <p className="text-muted-foreground">
            Approve to launch one agent per task.
          </p>
        </div>
        <Button variant="ghost" onClick={onBackToChat} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to chat
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span>{parsed?.title ?? "Execution plan"}</span>
            {parsed && (
              <Badge variant="secondary">
                {parsed.tasks.length} task{parsed.tasks.length === 1 ? "" : "s"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {planQuery.isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          )}
          {parsed?.tasks.map((t, idx) => (
            <div key={`${t.title}-${idx}`}>
              {idx > 0 && <Separator className="my-4" />}
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {idx + 1}. {t.title}
                </p>
                <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                  {t.instruction}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleApproveAndLaunch}
          size="lg"
          disabled={
            !parsed ||
            approve.isPending ||
            startExecution.isPending ||
            planQuery.isLoading
          }
          className="gap-2"
        >
          {(approve.isPending || startExecution.isPending) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <CheckCircle2 className="h-4 w-4" />
          Approve & Launch
        </Button>
      </div>
    </div>
  );
}

