"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ThoughtTrace as ThoughtTraceType } from "@/types";
import { ParticleField } from "./particle-field";
import { ThoughtTrace } from "./thought-trace";

interface ThinkingCanvasProps {
  thoughts: ThoughtTraceType[];
  isComplete: boolean;
  className?: string;
}

interface PositionedThought {
  thought: ThoughtTraceType;
  x: number;
  y: number;
}

const MAX_AMBIENT = 5;

/**
 * Generate a pseudo-random position from a thought ID.
 * Keeps thoughts in peripheral zones (avoids the center where the active thought sits).
 * Uses a simple hash so the same ID always gets the same position.
 */
function hashPosition(id: string): { x: number; y: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }

  // Pick one of 4 edge zones: left, right, top, bottom
  const zone = Math.abs(hash) % 4;
  const h2 = Math.abs((hash * 7919) | 0);

  switch (zone) {
    case 0: // left
      return { x: 5 + (h2 % 18), y: 10 + (h2 % 75) };
    case 1: // right
      return { x: 75 + (h2 % 18), y: 10 + (h2 % 75) };
    case 2: // top
      return { x: 15 + (h2 % 65), y: 5 + (h2 % 18) };
    case 3: // bottom
      return { x: 15 + (h2 % 65), y: 75 + (h2 % 18) };
    default:
      return { x: 15, y: 15 };
  }
}

export function ThinkingCanvas({ thoughts, isComplete, className }: ThinkingCanvasProps) {
  const currentThought = thoughts.at(-1) ?? null;

  const ambientThoughts: PositionedThought[] = useMemo(() => {
    if (thoughts.length <= 1) return [];
    const visible = thoughts.slice(-MAX_AMBIENT - 1, -1);
    return visible.map((thought) => {
      const pos = hashPosition(thought.id);
      return { thought, x: pos.x, y: pos.y };
    });
  }, [thoughts]);

  return (
    <motion.div
      className={cn("absolute inset-0 overflow-hidden", className)}
      animate={isComplete ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <ParticleField opacity={isComplete ? 0 : 0.6} />

      <AnimatePresence>
        {!isComplete &&
          ambientThoughts.map(({ thought, x, y }) => (
            <motion.div
              key={thought.id}
              className="pointer-events-none absolute max-w-[260px]"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.65, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <ThoughtTrace
                text={thought.text}
                variant={thought.variant}
                state="ambient"
              />
            </motion.div>
          ))}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentThought && !isComplete && (
          <motion.div
            key={currentThought.id}
            className="absolute inset-0 flex items-center justify-center px-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="max-w-lg text-center">
              <ThoughtTrace
                text={currentThought.text}
                variant={currentThought.variant}
                state="active"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
