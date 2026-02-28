"use client";

import { useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { ExecutionStats } from "@/components/execution/execution-stats";
import { AgentGrid } from "@/components/execution/agent-grid";
import { useExecutionStore } from "@/stores/use-execution-store";
import { MOCK_AGENTS } from "@/lib/mock-data";

export default function ExecutePage() {
  const { agents, setAgents } = useExecutionStore();

  useEffect(() => {
    if (agents.length === 0) {
      setAgents(MOCK_AGENTS);
    }
  }, [agents.length, setAgents]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Execution Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor and control your parallel browser agents
            </p>
          </div>
          <ExecutionStats />
          <AgentGrid />
        </div>
      </main>
    </div>
  );
}
