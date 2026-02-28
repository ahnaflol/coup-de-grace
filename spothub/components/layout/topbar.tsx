"use client";

import { GlobalSearch } from "@/components/shared/global-search";
import { QuickCreateMenu } from "@/components/shared/quick-create-menu";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <GlobalSearch />

      <div className="flex items-center gap-3">
        <QuickCreateMenu />
        <div className="flex size-8 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-white">
          JD
        </div>
      </div>
    </header>
  );
}
