"use client";

import { useRouter } from "next/navigation";
import { usePlanningStore } from "@/stores/use-planning-store";
import { useExecutionStore } from "@/stores/use-execution-store";
import { MOCK_AGENTS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CredentialsForm } from "./credentials-form";
import { ArrowLeft, Bot, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export function PlanReview() {
  const router = useRouter();
  const { planSteps, approvePlan, setStep } = usePlanningStore();
  const { setAgents } = useExecutionStore();

  const handleApprove = () => {
    approvePlan();
    setAgents(MOCK_AGENTS);
    toast.success("Plan approved! Launching agents...");
    router.push("/execute");
  };

  const handleReject = () => {
    setStep("chat");
    toast("Returning to chat to refine the plan.");
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Review Plan
          </h2>
          <p className="text-muted-foreground">
            {planSteps.length} agents will be launched in parallel.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setStep("chat")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution Plan</CardTitle>
          <CardDescription>
            Each step will be handled by an independent browser agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {planSteps.map((step, index) => (
            <div key={step.id}>
              {index > 0 && <Separator className="my-4" />}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{step.title}</h4>
                    <Badge variant="secondary" className="gap-1">
                      <Bot className="h-3 w-3" />
                      {step.agentCount} agent
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <CredentialsForm />

      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={handleReject} className="gap-2">
          <XCircle className="h-4 w-4" />
          Reject & Refine
        </Button>
        <Button onClick={handleApprove} size="lg" className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Approve & Launch
        </Button>
      </div>
    </div>
  );
}
