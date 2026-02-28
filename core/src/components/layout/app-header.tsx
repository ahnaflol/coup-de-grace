"use client";

import Link from "next/link";
import { Swords } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/plan" className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">
            Coup de Grace
          </span>
        </Link>
      </div>
    </header>
  );
}
