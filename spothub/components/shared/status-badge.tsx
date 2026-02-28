"use client";

import { Badge } from "@/components/ui/badge";
import { formatSnakeCase } from "@/lib/formatters";

type StatusVariant = "lifecycle" | "deal" | "ticket_status" | "ticket_priority";

const COLOR_MAP: Record<StatusVariant, Record<string, string>> = {
  lifecycle: {
    subscriber: "bg-slate-100 text-slate-700",
    lead: "bg-blue-100 text-blue-700",
    marketing_qualified: "bg-purple-100 text-purple-700",
    sales_qualified: "bg-indigo-100 text-indigo-700",
    opportunity: "bg-amber-100 text-amber-700",
    customer: "bg-green-100 text-green-700",
    evangelist: "bg-emerald-100 text-emerald-700",
  },
  deal: {
    appointment_scheduled: "bg-blue-100 text-blue-700",
    qualified_to_buy: "bg-cyan-100 text-cyan-700",
    presentation_scheduled: "bg-purple-100 text-purple-700",
    decision_maker_bought_in: "bg-amber-100 text-amber-700",
    contract_sent: "bg-orange-100 text-orange-700",
    closed_won: "bg-green-100 text-green-700",
    closed_lost: "bg-red-100 text-red-700",
  },
  ticket_status: {
    new: "bg-blue-100 text-blue-700",
    waiting_on_contact: "bg-amber-100 text-amber-700",
    waiting_on_us: "bg-orange-100 text-orange-700",
    in_progress: "bg-purple-100 text-purple-700",
    closed: "bg-slate-100 text-slate-700",
  },
  ticket_priority: {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  },
};

interface StatusBadgeProps {
  value: string;
  variant: StatusVariant;
}

export function StatusBadge({ value, variant }: StatusBadgeProps) {
  const colors = COLOR_MAP[variant]?.[value] ?? "bg-slate-100 text-slate-700";

  return (
    <Badge variant="outline" className={`border-transparent ${colors}`}>
      {formatSnakeCase(value)}
    </Badge>
  );
}
