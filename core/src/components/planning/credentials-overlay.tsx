"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, User, Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CredentialsResult } from "@/hooks/use-planner-chat";

interface CredentialsOverlayProps {
  reason: string;
  knownUrl?: string;
  onSubmit: (result: CredentialsResult) => void;
}

export function CredentialsOverlay({
  reason,
  knownUrl,
  onSubmit,
}: CredentialsOverlayProps) {
  const [url, setUrl] = useState(knownUrl ?? "");
  const [requiresLogin, setRequiresLogin] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit =
    url.trim() !== "" &&
    requiresLogin !== null &&
    (!requiresLogin || (username.trim() !== "" && password.trim() !== ""));

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      url: url.trim(),
      requiresLogin: requiresLogin ?? false,
      ...(requiresLogin && {
        username: username.trim(),
        password: password.trim(),
      }),
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Container with ripple clip-path */}
        <motion.div
          className="relative z-10 w-full max-w-md px-6"
          initial={{ clipPath: "circle(0% at 50% 50%)" }}
          animate={{ clipPath: "circle(75% at 50% 50%)" }}
          exit={{ clipPath: "circle(0% at 50% 50%)" }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.div
            className="relative rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.05, 1] }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Top accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-primary/30" />

            <div className="px-5 py-4">
              {/* Header */}
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Credentials needed
                  </p>
                  <p className="text-xs text-muted-foreground/60">{reason}</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* URL field */}
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                  <Input
                    type="url"
                    placeholder="https://app.example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-9 border-border/50 bg-transparent pl-9 text-sm placeholder:text-muted-foreground/40"
                  />
                </div>

                {/* Login toggle */}
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Does this site require login credentials?
                  </p>
                  <div className="flex gap-2">
                    {(["Yes", "No"] as const).map((option) => {
                      const isActive =
                        (option === "Yes" && requiresLogin === true) ||
                        (option === "No" && requiresLogin === false);
                      return (
                        <button
                          key={option}
                          onClick={() =>
                            setRequiresLogin(option === "Yes")
                          }
                          className={cn(
                            "rounded-md border px-5 py-2 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Username / Password fields */}
                <AnimatePresence>
                  {requiresLogin && (
                    <motion.div
                      className="grid grid-cols-2 gap-2"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                        <Input
                          placeholder="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="h-9 border-border/50 bg-transparent pl-9 text-sm placeholder:text-muted-foreground/40"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                        <Input
                          type="password"
                          placeholder="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-9 border-border/50 bg-transparent pl-9 text-sm placeholder:text-muted-foreground/40"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <div className="flex justify-end pt-1">
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="gap-2"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
