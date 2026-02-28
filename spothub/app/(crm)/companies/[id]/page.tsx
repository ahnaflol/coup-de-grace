"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { DetailLayout } from "@/components/detail-page/detail-layout";
import { DetailTopbar } from "@/components/detail-page/detail-topbar";
import { AboutSidebar } from "@/components/detail-page/about-sidebar";
import { ActivityTimeline } from "@/components/detail-page/activity-timeline";
import { AssociationsSidebar } from "@/components/detail-page/associations-sidebar";
import { useEntityDetail } from "@/hooks/use-entity-detail";
import { INDUSTRIES, COMPANY_SIZES, OWNERS } from "@/lib/constants";
import { formatSnakeCase } from "@/lib/formatters";
import type { Company, Contact, Deal, Ticket } from "@/types";
import type { PaginatedResponse } from "@/types/api";

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { entity, activities, isLoading, updateEntity } =
    useEntityDetail<Company>("companies", id);

  const [associations, setAssociations] = useState<
    { type: string; items: { id: string; name: string; subtitle: string; href: string }[] }[]
  >([]);

  const fetchAssociations = useCallback(async (company: Company) => {
    const groups: typeof associations = [];

    // Fetch associated contacts
    try {
      const contactsRes = await fetch(
        `/api/contacts?search=${encodeURIComponent(company.name)}`
      );
      if (contactsRes.ok) {
        const contactsData: PaginatedResponse<Contact> =
          await contactsRes.json();
        if (contactsData.data.length > 0) {
          groups.push({
            type: "Contacts",
            items: contactsData.data.map((contact) => ({
              id: contact.id,
              name: `${contact.firstName} ${contact.lastName}`,
              subtitle: contact.email,
              href: `/contacts/${contact.id}`,
            })),
          });
        }
      }
    } catch {
      // ignore
    }

    // Fetch associated deals
    try {
      const dealsRes = await fetch(
        `/api/deals?search=${encodeURIComponent(company.name)}`
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
        `/api/tickets?search=${encodeURIComponent(company.name)}`
      );
      if (ticketsRes.ok) {
        const ticketsData: PaginatedResponse<Ticket> =
          await ticketsRes.json();
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
    const updates: Partial<Company> =
      field === "annualRevenue"
        ? { annualRevenue: value ? Number(value) : null }
        : ({ [field]: value } as Partial<Company>);
    updateEntity(updates);
  }

  const ownerOptions = OWNERS.map((o) => ({ label: o.name, value: o.id }));
  const industryOptions = INDUSTRIES.map((i) => ({
    label: i.label,
    value: i.value,
  }));
  const sizeOptions = COMPANY_SIZES.map((s) => ({
    label: s.label,
    value: s.value,
  }));

  const properties = [
    { label: "Name", value: entity.name, field: "name", type: "text" as const },
    { label: "Domain", value: entity.domain, field: "domain", type: "text" as const },
    {
      label: "Industry",
      value: entity.industry,
      field: "industry",
      type: "select" as const,
      options: industryOptions,
    },
    {
      label: "Size",
      value: entity.size,
      field: "size",
      type: "select" as const,
      options: sizeOptions,
    },
    {
      label: "Annual Revenue",
      value: entity.annualRevenue?.toString() ?? "",
      field: "annualRevenue",
      type: "text" as const,
    },
    { label: "City", value: entity.city, field: "city", type: "text" as const },
    { label: "State", value: entity.state, field: "state", type: "text" as const },
    { label: "Country", value: entity.country, field: "country", type: "text" as const },
    {
      label: "Owner",
      value: entity.owner,
      field: "owner",
      type: "select" as const,
      options: ownerOptions,
    },
    { label: "Phone", value: entity.phone, field: "phone", type: "phone" as const },
    { label: "Description", value: entity.description, field: "description", type: "text" as const },
  ];

  return (
    <DetailLayout
      topbar={
        <DetailTopbar
          title={entity.name}
          subtitle={entity.domain}
          backHref="/companies"
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
