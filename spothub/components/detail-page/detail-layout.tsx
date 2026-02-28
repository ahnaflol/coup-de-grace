import { type ReactNode } from "react";

interface DetailLayoutProps {
  topbar: ReactNode;
  leftSidebar: ReactNode;
  mainContent: ReactNode;
  rightSidebar: ReactNode;
}

export function DetailLayout({
  topbar,
  leftSidebar,
  mainContent,
  rightSidebar,
}: DetailLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">{topbar}</div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[280px] shrink-0 overflow-y-auto border-r p-4">
          {leftSidebar}
        </aside>
        <main className="flex-1 overflow-y-auto p-6">{mainContent}</main>
        <aside className="w-[280px] shrink-0 overflow-y-auto border-l p-4">
          {rightSidebar}
        </aside>
      </div>
    </div>
  );
}
