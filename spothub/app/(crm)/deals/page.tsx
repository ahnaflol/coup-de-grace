"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { Deal } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useEntityList } from "@/hooks/use-entity-list";
import { useEntityMutation } from "@/hooks/use-entity-mutation";
import { DataTable } from "@/components/data-table/data-table";
import { EntityFormModal } from "@/components/forms/entity-form-modal";
import { DealForm } from "@/components/forms/deal-form";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { dealColumns } from "./columns";
import { DEAL_STAGES, OWNERS } from "@/lib/constants";
import type { FormRef } from "@/components/forms/contact-form";

const filterOptions = [
  {
    id: "stage",
    title: "Stage",
    options: DEAL_STAGES.map((s) => ({ label: s.label, value: s.value })),
  },
  {
    id: "priority",
    title: "Priority",
    options: [
      { label: "Low", value: "low" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
    ],
  },
  {
    id: "owner",
    title: "Owner",
    options: OWNERS.map((o) => ({ label: o.name, value: o.id })),
  },
];

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingSkeleton /></div>}>
      <DealsPageContent />
    </Suspense>
  );
}

function DealsPageContent() {
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
  } = useEntityList<Deal>("deals");

  const { createEntity, isLoading: isMutating } = useEntityMutation<Deal>("deals");
  const [createOpen, setCreateOpen] = useState(false);
  const formRef = useRef<FormRef>(null);

  const activeFilters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(filters)) {
    activeFilters[key] = value ? value.split(",") : [];
  }

  function handleFilterChange(filterId: string, values: string[]) {
    setFilters({ ...filters, [filterId]: values.join(",") });
  }

  async function handleCreate(data: Partial<Deal>) {
    await createEntity(data);
    setCreateOpen(false);
    refresh();
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Deals</h1>
          <Badge variant="secondary">{total}</Badge>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 size-4" />
          Create deal
        </Button>
      </div>

      <DataTable
        columns={dealColumns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSortChange={setSort}
        onRowClick={(row) => router.push(`/deals/${row.id}`)}
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
        title="Create deal"
        onSubmit={() => formRef.current?.submit()}
        isLoading={isMutating}
      >
        <DealForm ref={formRef} onSubmit={handleCreate} isLoading={isMutating} />
      </EntityFormModal>
    </div>
  );
}
