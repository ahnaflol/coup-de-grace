"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TASK_MODES } from "@/lib/constants";
import type { TaskMode } from "@/lib/constants";
import { ArrowRight, Upload, X, FileText } from "lucide-react";

interface PromptInputProps {
  onSubmit: (prompt: string, mode: TaskMode) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PromptInput({ onSubmit }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<TaskMode>(TASK_MODES[0].id);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
    },
    noClick: false,
  });

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (prompt.trim()) {
      onSubmit(prompt.trim(), mode);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Describe your task
        </h2>
        <p className="text-muted-foreground">
          Tell us what you want the agents to do. Be as detailed as possible.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex rounded-lg bg-muted p-1 gap-1">
          {TASK_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                mode === m.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
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

        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
            isDragActive
              ? "border-primary bg-primary-muted"
              : "border-border hover:border-primary/40 hover:bg-muted/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload
            className={cn(
              "h-6 w-6",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )}
          />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? "Drop files here"
              : "Drop files or click to upload (JSON, TXT, CSV)"}
          </p>
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <Badge
                key={`${file.name}-${index}`}
                variant="secondary"
                className="gap-1.5 pr-1"
              >
                <FileText className="h-3 w-3" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <span className="text-muted-foreground">
                  {formatSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            size="lg"
            className="gap-2"
          >
            Generate plan
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
