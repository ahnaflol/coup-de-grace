"use client";

import { KeyRound, Globe, User, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Credentials } from "@/types";

interface CredentialsCardProps {
  credentials: Credentials;
  onChange: (creds: Partial<Credentials>) => void;
}

export function CredentialsCard({
  credentials,
  onChange,
}: CredentialsCardProps) {
  return (
    <div className="relative rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm">
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-primary/30" />

      <div className="px-5 py-4">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <KeyRound className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Target credentials
            </p>
            <p className="text-xs text-muted-foreground/60">
              Agents will use these to authenticate
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <Input
              type="url"
              placeholder="https://app.example.com"
              value={credentials.url}
              onChange={(e) => onChange({ url: e.target.value })}
              className="h-9 border-border/50 bg-transparent pl-9 text-sm placeholder:text-muted-foreground/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
              <Input
                placeholder="username"
                value={credentials.username}
                onChange={(e) => onChange({ username: e.target.value })}
                className="h-9 border-border/50 bg-transparent pl-9 text-sm placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
              <Input
                type="password"
                placeholder="password"
                value={credentials.password}
                onChange={(e) => onChange({ password: e.target.value })}
                className="h-9 border-border/50 bg-transparent pl-9 text-sm placeholder:text-muted-foreground/40"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
