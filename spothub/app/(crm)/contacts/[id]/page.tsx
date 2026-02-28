"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { DetailLayout } from "@/components/detail-page/detail-layout";
import { DetailTopbar } from "@/components/detail-page/detail-topbar";
import { AboutSidebar } from "@/components/detail-page/about-sidebar";
import { ActivityTimeline } from "@/components/detail-page/activity-timeline";
import { AssociationsSidebar } from "@/components/detail-page/associations-sidebar";
import { StatusBadge } from "@/components/shared/status-badge";
import { useEntityDetail } from "@/hooks/use-entity-detail";
import { LIFECYCLE_STAGES, OWNERS } from "@/lib/constants";
import { formatSnakeCase } from "@/lib/formatters";
import type { Contact, Deal, Ticket, Company } from "@/types";
import type { PaginatedResponse } from "@/types/api";

export default function ContactDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { entity, activities, isLoading, updateEntity } =
    useEntityDetail<Contact>("contacts", id);

  const [associations, setAssociations] = useState<
    { type: string; items: { id: string; name: string; subtitle: string; href: string }[] }[]
  >([]);

  const fetchAssociations = useCallback(async (contact: Contact) => {
    const groups: typeof associations = [];

    // Fetch associated company
    if (contact.companyId) {
      try {
        const res = await fetch(`/api/companies/${contact.companyId}`);
        if (res.ok) {
          const company: Company = await res.json();
          groups.push({
            type: "Companies",
            items: [
              {
                id: company.id,
                name: company.name,
                subtitle: company.domain,
                href: `/companies/${company.id}`,
              },
            ],
          });
        }
      } catch {
        // ignore
      }
    }

    // Fetch associated deals
    const contactName = `${contact.firstName} ${contact.lastName}`;
    try {
      const dealsRes = await fetch(
        `/api/deals?search=${encodeURIComponent(contactName)}`
      );
      if (dealsRes.ok) {
        const dealsData: PaginatedResponse<Deal> = await dealsRes.json();
        if (dealsData.data.length > 0) {
          groups.push({
            type: "Deals",
            items: dealsData.data.map((deal) => ({
              id: deal.id,
              name: deal.name,
              subtitle: `$${deal.amount.toLocaleString()} - ${formatSnakeCase(deal.stage)}`,
              href: `/deals/${deal.id}`,
            })),
          });
        }
      }
    } catch {
      // ignore
    }

    // Fetch associated tickets
    try {
      const ticketsRes = await fetch(
        `/api/tickets?search=${encodeURIComponent(contactName)}`
      );
      if (ticketsRes.ok) {
        const ticketsData: PaginatedResponse<Ticket> = await ticketsRes.json();
        if (ticketsData.data.length > 0) {
          groups.push({
            type: "Tickets",
            items: ticketsData.data.map((ticket) => ({
              id: ticket.id,
              name: ticket.subject,
              subtitle: formatSnakeCase(ticket.status),
              href: `/tickets/${ticket.id}`,
            })),
          });
        }
      }
    } catch {
      // ignore
    }

    setAssociations(groups);
  }, []);

  useEffect(() => {
    if (entity) {
      fetchAssociations(entity);
    }
  }, [entity, fetchAssociations]);

  if (isLoading || !entity) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  function handlePropertyUpdate(field: string, value: string) {
    updateEntity({ [field]: value } as Partial<Contact>);
  }

  const ownerOptions = OWNERS.map((o) => ({ label: o.name, value: o.id }));
  const lifecycleOptions = LIFECYCLE_STAGES.map((s) => ({
    label: s.label,
    value: s.value,
  }));

  const properties = [
    { label: "First Name", value: entity.firstName, field: "firstName", type: "text" as const },
    { label: "Last Name", value: entity.lastName, field: "lastName", type: "text" as const },
    { label: "Email", value: entity.email, field: "email", type: "email" as const },
    { label: "Phone", value: entity.phone, field: "phone", type: "phone" as const },
    { label: "Job Title", value: entity.jobTitle, field: "jobTitle", type: "text" as const },
    {
      label: "Lifecycle Stage",
      value: entity.lifecycleStage,
      field: "lifecycleStage",
      type: "select" as const,
      options: lifecycleOptions,
    },
    {
      label: "Owner",
      value: entity.owner,
      field: "owner",
      type: "select" as const,
      options: ownerOptions,
    },
    { label: "City", value: entity.city, field: "city", type: "text" as const },
    { label: "State", value: entity.state, field: "state", type: "text" as const },
  ];

  return (
    <DetailLayout
      topbar={
        <DetailTopbar
          title={`${entity.firstName} ${entity.lastName}`}
          subtitle={entity.email}
          badge={
            <StatusBadge
              variant="lifecycle"
              value={entity.lifecycleStage}
            />
          }
          backHref="/contacts"
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
