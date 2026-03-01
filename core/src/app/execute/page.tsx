import { redirect } from "next/navigation";
import { ExecutionDashboard } from "@/components/execution/execution-dashboard";

export default async function ExecutePage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  const { planId } = await searchParams;
  if (!planId) redirect("/plan");

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <ExecutionDashboard planId={planId} />
    </div>
  );
}
