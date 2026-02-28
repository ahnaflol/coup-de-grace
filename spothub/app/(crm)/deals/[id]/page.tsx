"use client";

import { use } from "react";
import { useEntityDetail } from "@/hooks/use-entity-detail";
import type { Deal } from "@/types";
import { DetailLayout } from "@/components/detail-page/detail-layout";
import { DetailTopbar } from "@/components/detail-page/detail-topbar";
import { AboutSidebar } from "@/components/detail-page/about-sidebar";
import { ActivityTimeline } from "@/components/detail-page/activity-timeline";
import { AssociationsSidebar } from "@/components/detail-page/associations-sidebar";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency } from "@/lib/formatters";
import { DEAL_STAGES, OWNERS } from "@/lib/constants";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { entity: deal, activities, isLoading, updateEntity } =
    useEntityDetail<Deal>("deals", id);
  if (isLoading || !deal) {
    return <LoadingSkeleton />;
  }

  function handlePropertyUpdate(field: string, value: string) {
    updateEntity({ [field]: field === "amount" || field === "probability" ? Number(value) : value } as Partial<Deal>);
  }

  const properties = [
    { label: "Name", value: deal.name, field: "name", type: "text" as const },
    {
      label: "Amount",
      value: String(deal.amount),
      field: "amount",
      type: "text" as const,
    },
    {
      label: "Stage",
      value: deal.stage,
      field: "stage",
      type: "select" as const,
      options: DEAL_STAGES.map((s) => ({ label: s.label, value: s.value })),
    },
    {
      label: "Close Date",
      value: deal.closeDate ? deal.closeDate.split("T")[0] : "",
      field: "closeDate",
      type: "date" as const,
    },
    {
      label: "Priority",
      value: deal.priority,
      field: "priority",
      type: "select" as const,
      options: PRIORITY_OPTIONS,
    },
    {
      label: "Probability",
      value: String(deal.probability),
      field: "probability",
      type: "text" as const,
    },
    {
      label: "Owner",
      value: deal.owner,
      field: "owner",
      type: "select" as const,
      options: OWNERS.map((o) => ({ label: o.name, value: o.id })),
    },
    {
      label: "Description",
      value: deal.description || "",
      field: "description",
      type: "text" as const,
    },
  ];

  const associations = [];

  if (deal.companyId) {
    associations.push({
      type: "Companies",
      items: [
        {
          id: deal.companyId,
          name: deal.companyName || "Company",
          subtitle: "",
          href: `/companies/${deal.companyId}`,
        },
      ],
    });
  }

  if (deal.contactId) {
    associations.push({
      type: "Contacts",
      items: [
        {
          id: deal.contactId,
          name: deal.contactName || "Contact",
          subtitle: "",
          href: `/contacts/${deal.contactId}`,
        },
      ],
    });
  }

  associations.push({
    type: "Tickets",
    items: [],
  });

  return (
    <DetailLayout
      topbar={
        <DetailTopbar
          title={deal.name}
          subtitle={formatCurrency(deal.amount)}
          badge={<StatusBadge variant="deal" value={deal.stage} />}
          backHref="/deals"
        />
      }
      leftSidebar={
        <AboutSidebar
          properties={properties}
          onUpdate={handlePropertyUpdate}
        />
      }
      mainContent={
        <ActivityTimeline activities={activities} isLoading={isLoading} />
      }
      rightSidebar={<AssociationsSidebar associations={associations} />}
    />
  );
}
