"use client";

import { useExecutionStore } from "@/stores/use-execution-store";
import { AgentCard } from "./agent-card";
import { motion } from "framer-motion";

export function AgentGrid() {
  const { agents } = useExecutionStore();

  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">
          No agents running. Approve a plan to launch agents.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent, index) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: index * 0.08,
            ease: "easeOut",
          }}
        >
          <AgentCard agent={agent} />
        </motion.div>
      ))}
    </div>
  );
}
