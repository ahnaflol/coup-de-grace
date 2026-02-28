"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Swords } from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();
  const isPlan = pathname.startsWith("/plan");
  const isExecute = pathname.startsWith("/execute");

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/plan" className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">
            Coup de Grace
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <Link
            href="/plan"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isPlan
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Plan
          </Link>
          <Link
            href="/execute"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isExecute
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Execute
          </Link>
        </nav>
      </div>
    </header>
  );
}
