"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  FlaskConical,
  ArrowLeftRight,
  Keyboard,
  Paperclip,
  ArrowRight,
  X,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TASK_MODES } from "@/lib/constants";
import type { TaskMode } from "@/lib/constants";

interface PromptInputProps {
  onSubmit: (prompt: string, mode: TaskMode) => void;
}

const MODE_ICONS: Record<TaskMode, LucideIcon> = {
  testing: FlaskConical,
  "data-migration": ArrowLeftRight,
  "data-entry": Keyboard,
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function computeLineCount(text: string): number {
  return text === "" ? 1 : text.split("\n").length;
}

export function PromptInput({ onSubmit }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<TaskMode>(TASK_MODES[0].id);
  const [files, setFiles] = useState<File[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    noClick: true,
    noKeyboard: true,
  });

  function removeFile(index: number): void {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(): void {
    if (prompt.trim()) {
      onSubmit(prompt.trim(), mode);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && prompt.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Sync textarea scroll with line numbers
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const textarea = textareaRef.current;
    const lineNumbers = lineNumbersRef.current;
    if (!textarea || !lineNumbers) return;

    function syncScroll(): void {
      if (lineNumbers && textarea) {
        lineNumbers.scrollTop = textarea.scrollTop;
      }
    }

    textarea.addEventListener("scroll", syncScroll);
    return () => textarea.removeEventListener("scroll", syncScroll);
  }, []);

  const hasPrompt = prompt.trim().length > 0;
  const lineCount = computeLineCount(prompt);

  const statusLabel = hasPrompt ? "COMPOSING" : "READY";

  return (
    <div {...getRootProps()} className="mx-auto w-full max-w-4xl px-4">
      <input {...getInputProps()} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          {/* Card with scanline + dot-matrix textures */}
          <div
            className={cn(
              "relative overflow-hidden rounded-md border border-primary/10 bg-card",
              "transition-shadow duration-300",
              isDragActive && "ring-1 ring-primary/20",
            )}
            style={{
              boxShadow: isFocused
                ? "0 0 0 1px rgba(var(--primary-rgb, 220 120 80) / 0.08), 0 4px 24px rgba(0,0,0,0.06)"
                : "0 4px 24px rgba(0,0,0,0.04)",
            }}
          >
            {/* Scanline overlay */}
            <div
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(var(--primary-rgb, 220 120 80) / 0.015) 2px, rgba(var(--primary-rgb, 220 120 80) / 0.015) 4px)",
              }}
            />

            {/* Dot-matrix overlay */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(var(--primary-rgb, 220 120 80) / 0.05) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />

            {/* Top edge accent line */}
            <div
              className={cn(
                "h-px transition-colors duration-500",
                isFocused ? "bg-primary/40" : "bg-primary/20",
              )}
            />

            {/* Content above textures */}
            <div className="relative z-10">
              {/* Header */}
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-between px-5 py-3"
              >
                {/* Left: status dot + label */}
                <div className="flex items-center gap-2.5 select-none">
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full bg-primary",
                      !hasPrompt && "animate-pulse",
                    )}
                    style={{
                      boxShadow: "0 0 6px rgba(var(--primary-rgb, 220 120 80) / 0.35)",
                    }}
                  />
                  <span className="font-mono text-xs font-medium uppercase tracking-wider text-primary/60">
                    <span className="text-primary/25">[</span>
                    {" "}Mission Briefing{" "}
                    <span className="text-primary/25">]</span>
                  </span>
                </div>

                {/* Right: status label */}
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-widest transition-colors duration-200",
                    hasPrompt ? "text-primary/50" : "text-primary/25",
                  )}
                >
                  {statusLabel}
                </span>
              </motion.div>

              {/* Accent divider */}
              <div className="mx-5 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

              {/* Mode selector */}
              <motion.div variants={itemVariants} className="px-5 py-3">
                <div className="flex rounded-md border border-primary/8 bg-muted/30">
                  {TASK_MODES.map((m) => {
                    const Icon = MODE_ICONS[m.id];
                    const isActive = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        className={cn(
                          "relative flex flex-1 items-center justify-center gap-1.5 border-r border-primary/8 px-3 py-2 font-mono text-xs tracking-wide transition-all duration-150 last:border-r-0",
                          isActive
                            ? "bg-primary/5 text-primary"
                            : "text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-primary/[0.02]",
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        <span>{m.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="mode-underline"
                            className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                            style={{
                              boxShadow:
                                "0 0 6px rgba(var(--primary-rgb, 220 120 80) / 0.25)",
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Textarea with line numbers */}
              <motion.div variants={itemVariants} className="relative px-5 pb-2">
                <div className="relative">
                  {/* Line number gutter */}
                  <div
                    ref={lineNumbersRef}
                    className="pointer-events-none absolute bottom-0 left-0 top-0 flex w-8 select-none flex-col overflow-hidden font-mono text-[10px] leading-[calc(0.85rem*1.65)] text-primary/15"
                    style={{ paddingTop: "0.75rem" }}
                  >
                    {Array.from({ length: lineCount }, (_, i) => (
                      <span key={i}>{String(i + 1).padStart(2, "0")}</span>
                    ))}
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe what the agents should do. Be specific about flows, edge cases, and expected outcomes..."
                    maxLength={4000}
                    className={cn(
                      "w-full min-h-[180px] rounded border border-primary/10 bg-background/50 py-3 pl-9 pr-4",
                      "font-mono text-sm leading-[calc(0.85rem*1.65)] text-foreground font-medium",
                      "placeholder:text-muted-foreground/40",
                      "outline-none resize-none",
                      "transition-all duration-200",
                      "focus:border-primary/25",
                    )}
                  />
                </div>
              </motion.div>

              {/* File badges area */}
              <AnimatePresence mode="popLayout">
                {files.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-5 pb-3"
                  >
                    <div className="flex flex-wrap gap-2">
                      {files.map((file, index) => (
                        <motion.span
                          key={`${file.name}-${index}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="group/file inline-flex items-center gap-2 rounded border border-primary/10 bg-primary/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-primary/60"
                        >
                          <FileText className="h-3 w-3 text-primary/30" />
                          <span className="max-w-[100px] truncate">
                            {file.name}
                          </span>
                          <span className="text-primary/25">
                            {formatSize(file.size)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="ml-0.5 text-primary/30 opacity-40 transition-opacity group-hover/file:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Accent divider */}
              <div className="mx-5 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

              {/* Footer */}
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-between px-5 py-3"
              >
                {/* Left: attach + char count */}
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded border border-primary/8 bg-background/30 px-2.5 py-1.5 font-mono text-[11px] tracking-wide text-primary/40 transition-colors hover:border-primary/20 hover:text-primary/60">
                    <Paperclip className="h-3 w-3" />
                    <span>Attach files</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".json,.txt,.csv"
                      multiple
                      onChange={(e) => {
                        const selected = e.target.files;
                        if (selected && selected.length > 0) {
                          setFiles((prev) => [
                            ...prev,
                            ...Array.from(selected),
                          ]);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>

                  <span
                    className={cn(
                      "font-mono text-[10px] tracking-wider transition-colors",
                      prompt.length > 3600
                        ? "text-primary/60"
                        : "text-primary/20",
                    )}
                  >
                    {prompt.length} / 4000
                  </span>
                </div>

                {/* Right: kbd hint + deploy */}
                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {hasPrompt && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-mono text-[10px] tracking-wide text-primary/25 select-none"
                      >
                        <kbd className="rounded border border-primary/10 bg-primary/[0.04] px-1.5 py-0.5">
                          Cmd
                        </kbd>
                        <span className="mx-0.5">+</span>
                        <kbd className="rounded border border-primary/10 bg-primary/[0.04] px-1.5 py-0.5">
                          Enter
                        </kbd>
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <Button
                    onClick={handleSubmit}
                    disabled={!hasPrompt}
                    className={cn(
                      "group gap-2 font-mono text-xs font-semibold uppercase tracking-wider transition-shadow duration-300",
                      hasPrompt &&
                        "shadow-[0_0_12px_rgba(220,120,80,0.15)] hover:shadow-[0_0_20px_rgba(220,120,80,0.25)]",
                    )}
                  >
                    Deploy
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
