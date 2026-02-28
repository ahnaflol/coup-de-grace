"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollText } from "lucide-react";
import type { AgentLogEntry } from "@/types";

interface AgentActionLogProps {
  agentName: string;
  logs: AgentLogEntry[];
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function AgentActionLog({ agentName, logs }: AgentActionLogProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs">
          <ScrollText className="h-3.5 w-3.5" />
          Logs ({logs.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{agentName} - Action Log</SheetTitle>
          <SheetDescription>
            {logs.length} actions recorded
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
          <div className="space-y-3 pr-4">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No actions recorded yet.
              </p>
            ) : (
              logs.map((entry) => (
                <div
                  key={entry.id}
                  className="flex gap-3 rounded-lg border p-3"
                >
                  <div className="shrink-0 text-[10px] font-mono text-muted-foreground pt-0.5">
                    {formatTime(entry.timestamp)}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.detail}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
