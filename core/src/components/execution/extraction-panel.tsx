"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Download, Database, Loader2 } from "lucide-react";
import { DataTable } from "./data-table";
import type { TaskEventWithTime } from "./execution-dashboard";
import type { TaskStatus } from "@/types";
import { isRecord, toStringRecord } from "@/lib/utils";

interface ExtractedRow {
  taskId: string;
  rowIndex: number;
  data: Record<string, string>;
}

function downloadCsv(headers: string[], rows: Record<string, string>[]) {
  const csvLines = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows.map((row) =>
      headers
        .map((h) => `"${(row[h] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  const csvContent = csvLines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "extraction-results.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ExtractionPanel({
  eventsByTaskId,
  tasks,
}: {
  eventsByTaskId: Record<string, TaskEventWithTime[]>;
  tasks: Array<{ id: string; status: TaskStatus }>;
}) {
  // Collect row_extracted events from all tasks
  const extractedRows = useMemo(() => {
    const rows: ExtractedRow[] = [];
    for (const [taskId, taskEvents] of Object.entries(eventsByTaskId)) {
      for (const event of taskEvents) {
        if (event.type === "row_extracted" && isRecord(event.data)) {
          const data = event.data.data;
          const rowIndex =
            typeof event.data.rowIndex === "number" ? event.data.rowIndex : 0;
          if (isRecord(data)) {
            rows.push({ taskId, rowIndex, data: toStringRecord(data) });
          }
        }
      }
    }
    return rows;
  }, [eventsByTaskId]);

  // Derive headers from all rows
  const headers = useMemo(() => {
    const keySet = new Set<string>();
    for (const row of extractedRows) {
      for (const k of Object.keys(row.data)) {
        keySet.add(k);
      }
    }
    return Array.from(keySet);
  }, [extractedRows]);

  const isRunning = tasks.some(
    (t) => t.status === "running" || t.status === "pending",
  );
  const allDone = tasks.length > 0 && tasks.every(
    (t) => t.status === "completed" || t.status === "failed",
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 shrink-0">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-zinc-200">
            Extracted Data
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] bg-zinc-800 text-zinc-400"
          >
            {extractedRows.length} row{extractedRows.length !== 1 ? "s" : ""}
          </Badge>
          {isRunning && (
            <Loader2 className="h-3.5 w-3.5 text-zinc-500 animate-spin" />
          )}
        </div>
        {allDone && extractedRows.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-7 text-xs text-zinc-300 hover:text-white hover:bg-white/10"
            onClick={() => downloadCsv(headers, extractedRows.map((r) => r.data))}
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </Button>
        )}
      </div>

      {/* Table */}
      {extractedRows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-600">
            {isRunning
              ? "Waiting for agents to extract data..."
              : "No data extracted."}
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          <div className="overflow-x-auto">
            <DataTable
              headers={headers}
              rows={extractedRows.map((r) => r.data)}
              stickyHeader
            />
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
