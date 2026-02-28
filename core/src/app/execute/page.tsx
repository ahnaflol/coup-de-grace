import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ExecutionDashboard } from "@/components/execution/execution-dashboard";

export default async function ExecutePage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  const { planId } = await searchParams;
  if (!planId) redirect("/plan");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Execution dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor parallel agents as they run.
            </p>
          </div>
          <ExecutionDashboard planId={planId} />
        </div>
      </main>
    </div>
  );
}

