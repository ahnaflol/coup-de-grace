import { Suspense } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { PlanningFlow } from "@/components/planning/planning-flow";

export default function PlanPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col">
        <Suspense>
          <PlanningFlow />
        </Suspense>
      </main>
    </div>
  );
}
