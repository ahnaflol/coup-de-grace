"use client";

import { useExecutionStore } from "@/stores/use-execution-store";
import { Button } from "@/components/ui/button";
import { Square, RotateCcw } from "lucide-react";
import type { AgentStatus } from "@/types";
import { toast } from "sonner";

interface AgentControlsProps {
  agentId: string;
  status: AgentStatus;
}

export function AgentControls({ agentId, status }: AgentControlsProps) {
  const { stopAgent, restartAgent } = useExecutionStore();

  const handleStop = () => {
    stopAgent(agentId);
    toast("Agent stopped.");
  };

  const handleRestart = () => {
    restartAgent(agentId);
    toast.success("Agent restarted.");
  };

  return (
    <div className="flex gap-1.5">
      {status === "running" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          className="gap-1.5 h-7 text-xs text-destructive hover:text-destructive"
        >
          <Square className="h-3 w-3" />
          Stop
        </Button>
      )}
      {(status === "failed" || status === "completed") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestart}
          className="gap-1.5 h-7 text-xs"
        >
          <RotateCcw className="h-3 w-3" />
          Restart
        </Button>
      )}
    </div>
  );
}
