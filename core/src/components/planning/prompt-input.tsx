"use client";

import { useCallback, useState } from "react";
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

export function PromptInput({ onSubmit }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<TaskMode>(TASK_MODES[0].id);
  const [files, setFiles] = useState<File[]>([]);
  const [isFocused, setIsFocused] = useState(false);

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

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (prompt.trim()) {
      onSubmit(prompt.trim(), mode);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && prompt.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const hasPrompt = prompt.trim().length > 0;

  return (
    <div
      {...getRootProps()}
      className="mx-auto w-full max-w-2xl px-4"
    >
      <input {...getInputProps()} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      {/* Gradient border wrapper */}
      <motion.div variants={itemVariants}>
        <div
          className={cn(
            "rounded-xl p-px bg-gradient-to-b transition-all duration-500",
            isDragActive
              ? "from-primary/40 via-primary/15 to-border/30"
              : isFocused
                ? "from-primary/40 via-primary/15 to-border/30"
                : "from-primary/25 via-border/40 to-border/20"
          )}
        >
          {/* Inner panel */}
          <div
            className={cn(
              "relative rounded-xl bg-card/80 backdrop-blur-sm overflow-hidden",
              "bg-[radial-gradient(ellipse_at_top,rgba(220,120,80,0.03)_0%,transparent_60%)]"
            )}
            style={
              isFocused
                ? {
                    boxShadow:
                      "0 0 0 1px rgba(220,120,80,0.1), 0 0 30px rgba(220,120,80,0.05)",
                  }
                : undefined
            }
          >
            {/* Top accent line */}
            <div
              className={cn(
                "h-px transition-colors duration-500",
                isFocused ? "bg-primary/50" : "bg-primary/20"
              )}
            />

            {/* Header strip */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between px-5 py-3 border-b border-border/30"
            >
              {/* Left: label */}
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60 select-none">
                Mission Briefing
              </span>

              {/* Center: mode selector */}
              <div className="flex items-center gap-1">
                {TASK_MODES.map((m) => {
                  const Icon = MODE_ICONS[m.id];
                  const isActive = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={cn(
                        "group relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-primary/[0.06]"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-300" />
                      <span>{m.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="mode-indicator"
                          className="absolute -bottom-[13px] inset-x-1 h-px bg-primary/60"
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

              {/* Right: character count */}
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground/40 select-none">
                {prompt.length}
              </span>
            </motion.div>

            {/* Textarea */}
            <motion.div variants={itemVariants}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what the agents should do. Be specific about flows, edge cases, and expected outcomes..."
                className={cn(
                  "w-full min-h-[180px] px-5 py-4 bg-transparent border-0 outline-none resize-none",
                  "text-sm leading-relaxed text-foreground",
                  "placeholder:text-muted-foreground/30",
                  "font-sans"
                )}
              />
            </motion.div>

            {/* Footer bar */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between px-5 py-3 border-t border-border/30"
            >
              {/* Left: file drop zone + file badges */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground/40 cursor-pointer hover:text-muted-foreground/60 transition-colors shrink-0">
                  <Paperclip className="h-3.5 w-3.5" />
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

                <AnimatePresence mode="popLayout">
                  {files.map((file, index) => (
                    <motion.span
                      key={`${file.name}-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1 font-mono text-[10px] border border-border/40 bg-muted/30 rounded-md px-2 py-0.5"
                    >
                      <FileText className="h-2.5 w-2.5 text-muted-foreground/50" />
                      <span className="max-w-[100px] truncate text-muted-foreground/70">
                        {file.name}
                      </span>
                      <span className="text-muted-foreground/40">
                        {formatSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                      >
                        <X className="h-2.5 w-2.5 text-muted-foreground/50" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              {/* Right: deploy button + hint */}
              <div className="flex items-center gap-3 shrink-0">
                {hasPrompt && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-[10px] text-muted-foreground/30 select-none"
                  >
                    Cmd+Enter
                  </motion.span>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={!hasPrompt}
                  className={cn(
                    "group gap-2 transition-shadow duration-300",
                    hasPrompt &&
                      "shadow-[0_0_12px_rgba(220,120,80,0.15)] hover:shadow-[0_0_20px_rgba(220,120,80,0.25)]"
                  )}
                >
                  Deploy
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
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
