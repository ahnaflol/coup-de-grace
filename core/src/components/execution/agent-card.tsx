"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AgentBrowserView } from "./agent-browser-view";
import { AgentStatusBadge } from "./agent-status-badge";
import { AgentActionLog } from "./agent-action-log";
import { AgentControls } from "./agent-controls";
import type { Agent } from "@/types";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold">{agent.name}</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
              {agent.taskDescription}
            </p>
          </div>
          <AgentStatusBadge status={agent.status} />
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <AgentBrowserView status={agent.status} agentName={agent.name} />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{agent.progress}%</span>
          </div>
          <Progress value={agent.progress} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between">
          <AgentActionLog agentName={agent.name} logs={agent.logs} />
          <AgentControls agentId={agent.id} status={agent.status} />
        </div>
      </CardContent>
    </Card>
  );
}
