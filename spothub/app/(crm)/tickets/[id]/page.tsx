"use client";

import { use } from "react";
import { useEntityDetail } from "@/hooks/use-entity-detail";
import type { Ticket } from "@/types";
import { DetailLayout } from "@/components/detail-page/detail-layout";
import { DetailTopbar } from "@/components/detail-page/detail-topbar";
import { AboutSidebar } from "@/components/detail-page/about-sidebar";
import { ActivityTimeline } from "@/components/detail-page/activity-timeline";
import { AssociationsSidebar } from "@/components/detail-page/associations-sidebar";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  OWNERS,
} from "@/lib/constants";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { entity: ticket, activities, isLoading, updateEntity } =
    useEntityDetail<Ticket>("tickets", id);
  if (isLoading || !ticket) {
    return <LoadingSkeleton />;
  }

  function handlePropertyUpdate(field: string, value: string) {
    updateEntity({ [field]: value } as Partial<Ticket>);
  }

  const properties = [
    {
      label: "Subject",
      value: ticket.subject,
      field: "subject",
      type: "text" as const,
    },
    {
      label: "Status",
      value: ticket.status,
      field: "status",
      type: "select" as const,
      options: TICKET_STATUSES.map((s) => ({ label: s.label, value: s.value })),
    },
    {
      label: "Priority",
      value: ticket.priority,
      field: "priority",
      type: "select" as const,
      options: TICKET_PRIORITIES.map((p) => ({
        label: p.label,
        value: p.value,
      })),
    },
    {
      label: "Category",
      value: ticket.category,
      field: "category",
      type: "select" as const,
      options: TICKET_CATEGORIES.map((c) => ({
        label: c.label,
        value: c.value,
      })),
    },
    {
      label: "Owner",
      value: ticket.owner,
      field: "owner",
      type: "select" as const,
      options: OWNERS.map((o) => ({ label: o.name, value: o.id })),
    },
    {
      label: "Description",
      value: ticket.description || "",
      field: "description",
      type: "text" as const,
    },
  ];

  const associations = [];

  if (ticket.contactId) {
    associations.push({
      type: "Contacts",
      items: [
        {
          id: ticket.contactId,
          name: ticket.contactName || "Contact",
          subtitle: "",
          href: `/contacts/${ticket.contactId}`,
        },
      ],
    });
  }

  if (ticket.companyId) {
    associations.push({
      type: "Companies",
      items: [
        {
          id: ticket.companyId,
          name: ticket.companyName || "Company",
          subtitle: "",
          href: `/companies/${ticket.companyId}`,
        },
      ],
    });
  }

  associations.push({
    type: "Deals",
    items: [],
  });

  return (
    <DetailLayout
      topbar={
        <DetailTopbar
          title={ticket.subject}
          badge={
            <StatusBadge variant="ticket_status" value={ticket.status} />
          }
          backHref="/tickets"
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
