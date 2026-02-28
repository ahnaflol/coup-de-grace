"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { EntityFormModal } from "@/components/forms/entity-form-modal";
import { ContactForm, type FormRef } from "@/components/forms/contact-form";
import { useEntityList } from "@/hooks/use-entity-list";
import { useEntityMutation } from "@/hooks/use-entity-mutation";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { contactColumns } from "./columns";
import { LIFECYCLE_STAGES, OWNERS } from "@/lib/constants";
import type { Contact } from "@/types";

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingSkeleton /></div>}>
      <ContactsPageContent />
    </Suspense>
  );
}

function ContactsPageContent() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const formRef = useRef<FormRef>(null);

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
  } = useEntityList<Contact>("contacts");

  const { createEntity, isLoading: isCreating } =
    useEntityMutation<Contact>("contacts");

  const filterOptions = [
    {
      id: "lifecycleStage",
      title: "Lifecycle Stage",
      options: LIFECYCLE_STAGES.map((s) => ({
        label: s.label,
        value: s.value,
      })),
    },
    {
      id: "owner",
      title: "Owner",
      options: OWNERS.map((o) => ({ label: o.name, value: o.id })),
    },
  ];

  const activeFilters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value) activeFilters[key] = [value];
  }

  function handleFilterChange(filterId: string, values: string[]) {
    setFilters({ ...filters, [filterId]: values[0] ?? "" });
  }

  async function handleCreate(data: Partial<Contact>) {
    await createEntity(data);
    setCreateOpen(false);
    refresh();
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Contacts</h1>
          <Badge variant="secondary">{total}</Badge>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 size-4" />
          Create contact
        </Button>
      </div>

      <DataTable
        columns={contactColumns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSortChange={setSort}
        onRowClick={(row) => router.push(`/contacts/${row.id}`)}
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
        title="Create contact"
        onSubmit={() => formRef.current?.submit()}
        isLoading={isCreating}
      >
        <ContactForm
          ref={formRef}
          onSubmit={handleCreate}
          isLoading={isCreating}
        />
      </EntityFormModal>
    </div>
  );
}
