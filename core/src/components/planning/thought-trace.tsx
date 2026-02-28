"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ThoughtAnimationVariant } from "@/types";

type ThoughtState = "entering" | "active" | "ambient" | "exiting";

interface ThoughtTraceProps {
  text: string;
  variant: ThoughtAnimationVariant;
  state: ThoughtState;
  className?: string;
}

const stateStyles: Record<ThoughtState, string> = {
  entering: "opacity-100 scale-100",
  active: "opacity-100 scale-100",
  ambient: "opacity-20 scale-[0.8]",
  exiting: "opacity-0 scale-100",
};

// -- Variant: typewriter --
function TypewriterText({ text, state }: { text: string; state: ThoughtState }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (state !== "entering" && state !== "active") {
      setVisibleCount(text.length);
      return;
    }

    setVisibleCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= text.length) clearInterval(interval);
    }, 5);

    return () => clearInterval(interval);
  }, [text, state]);

  return (
    <span>
      {text.slice(0, visibleCount)}
      {visibleCount < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
}

// -- Variant: slide-blur --
const slideBlurVariants: Variants = {
  entering: {
    y: 40,
    filter: "blur(8px)",
    opacity: 0,
  },
  active: {
    y: 0,
    filter: "blur(0px)",
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  ambient: {
    y: 0,
    filter: "blur(0px)",
    opacity: 0.2,
    scale: 0.8,
    transition: { duration: 0.4 },
  },
  exiting: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

// -- Variant: scale-bounce --
const scaleBounceVariants: Variants = {
  entering: {
    scale: 0,
    opacity: 0,
  },
  active: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15,
    },
  },
  ambient: {
    scale: 0.8,
    opacity: 0.2,
    transition: { duration: 0.4 },
  },
  exiting: {
    scale: 0.8,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

// -- Variant: wipe-reveal --
const wipeRevealVariants: Variants = {
  entering: {
    clipPath: "inset(0 100% 0 0)",
    opacity: 1,
  },
  active: {
    clipPath: "inset(0 0% 0 0)",
    opacity: 1,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  ambient: {
    clipPath: "inset(0 0% 0 0)",
    opacity: 0.2,
    scale: 0.8,
    transition: { duration: 0.4 },
  },
  exiting: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

// -- Variant: fade-glow --
const fadeGlowVariants: Variants = {
  entering: {
    opacity: 0,
    textShadow: "0 0 0px rgba(220, 120, 80, 0)",
  },
  active: {
    opacity: 1,
    textShadow: "0 0 20px rgba(220, 120, 80, 0.5)",
    transition: { duration: 0.6, ease: "easeOut" },
  },
  ambient: {
    opacity: 0.2,
    scale: 0.8,
    textShadow: "0 0 0px rgba(220, 120, 80, 0)",
    transition: { duration: 0.4 },
  },
  exiting: {
    opacity: 0,
    textShadow: "0 0 0px rgba(220, 120, 80, 0)",
    transition: { duration: 0.3 },
  },
};

const variantMap: Record<ThoughtAnimationVariant, Variants | null> = {
  typewriter: null, // handled by custom component
  "slide-blur": slideBlurVariants,
  "scale-bounce": scaleBounceVariants,
  "wipe-reveal": wipeRevealVariants,
  "fade-glow": fadeGlowVariants,
};

function getTypewriterAnimate(state: ThoughtState): Record<string, number> {
  if (state === "ambient") return { opacity: 0.2, scale: 0.8 };
  if (state === "exiting") return { opacity: 0 };
  return {};
}

export function ThoughtTrace({ text, variant, state, className }: ThoughtTraceProps) {
  const motionVariants = variantMap[variant];

  if (variant === "typewriter") {
    return (
      <motion.div
        className={cn(
          "text-base font-medium text-foreground/90 transition-all duration-400",
          stateStyles[state],
          className,
        )}
        animate={getTypewriterAnimate(state)}
        transition={{ duration: 0.4 }}
      >
        <TypewriterText text={text} state={state} />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("text-base font-medium text-foreground/90", className)}
      variants={motionVariants ?? undefined}
      initial="entering"
      animate={state}
    >
      {text}
    </motion.div>
  );
}
