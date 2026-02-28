"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { Ticket } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useEntityList } from "@/hooks/use-entity-list";
import { useEntityMutation } from "@/hooks/use-entity-mutation";
import { DataTable } from "@/components/data-table/data-table";
import { EntityFormModal } from "@/components/forms/entity-form-modal";
import { TicketForm } from "@/components/forms/ticket-form";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ticketColumns } from "./columns";
import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  OWNERS,
} from "@/lib/constants";
import type { FormRef } from "@/components/forms/contact-form";

const filterOptions = [
  {
    id: "status",
    title: "Status",
    options: TICKET_STATUSES.map((s) => ({ label: s.label, value: s.value })),
  },
  {
    id: "priority",
    title: "Priority",
    options: TICKET_PRIORITIES.map((p) => ({ label: p.label, value: p.value })),
  },
  {
    id: "category",
    title: "Category",
    options: TICKET_CATEGORIES.map((c) => ({ label: c.label, value: c.value })),
  },
  {
    id: "owner",
    title: "Owner",
    options: OWNERS.map((o) => ({ label: o.name, value: o.id })),
  },
];

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingSkeleton /></div>}>
      <TicketsPageContent />
    </Suspense>
  );
}

function TicketsPageContent() {
  const router = useRouter();
  const {
    data,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    search,
    filters,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    refresh,
  } = useEntityList<Ticket>("tickets");

  const { createEntity, isLoading: isMutating } = useEntityMutation<Ticket>("tickets");
  const [createOpen, setCreateOpen] = useState(false);
  const formRef = useRef<FormRef>(null);

  const activeFilters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(filters)) {
    activeFilters[key] = value ? value.split(",") : [];
  }

  function handleFilterChange(filterId: string, values: string[]) {
    setFilters({ ...filters, [filterId]: values.join(",") });
  }

  async function handleCreate(data: Partial<Ticket>) {
    await createEntity(data);
    setCreateOpen(false);
    refresh();
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Tickets</h1>
          <Badge variant="secondary">{total}</Badge>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 size-4" />
          Create ticket
        </Button>
      </div>

      <DataTable
        columns={ticketColumns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSortChange={setSort}
        onRowClick={(row) => router.push(`/tickets/${row.id}`)}
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        isLoading={isLoading}
      />

      <EntityFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create ticket"
        onSubmit={() => formRef.current?.submit()}
        isLoading={isMutating}
      >
        <TicketForm ref={formRef} onSubmit={handleCreate} isLoading={isMutating} />
      </EntityFormModal>
    </div>
  );
}
