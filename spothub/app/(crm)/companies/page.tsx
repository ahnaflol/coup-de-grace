"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { EntityFormModal } from "@/components/forms/entity-form-modal";
import { CompanyForm } from "@/components/forms/company-form";
import type { FormRef } from "@/components/forms/contact-form";
import { useEntityList } from "@/hooks/use-entity-list";
import { useEntityMutation } from "@/hooks/use-entity-mutation";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { companyColumns } from "./columns";
import { INDUSTRIES, COMPANY_SIZES, OWNERS } from "@/lib/constants";
import type { Company } from "@/types";

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingSkeleton /></div>}>
      <CompaniesPageContent />
    </Suspense>
  );
}

function CompaniesPageContent() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
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
  } = useEntityList<Company>("companies");

  const { createEntity, isLoading: isCreating } =
    // SH-SEED-002 (intentional): wrong entity type; POSTs to /api/company and creation fails.
    useEntityMutation<Company>("company");

  const filterOptions = [
    {
      id: "industry",
      title: "Industry",
      options: INDUSTRIES.map((i) => ({ label: i.label, value: i.value })),
    },
    {
      id: "size",
      title: "Company Size",
      options: COMPANY_SIZES.map((s) => ({ label: s.label, value: s.value })),
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

  async function handleCreate(data: Partial<Company>) {
    setCreateError(null);
    try {
      await createEntity(data);
      setCreateOpen(false);
      refresh();
    } catch (err) {
      // SH-SEED-002: make the failure obvious in the UI.
      setCreateError(
        err instanceof Error ? err.message : "Failed to create company"
      );
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Companies</h1>
          <Badge variant="secondary">{total}</Badge>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 size-4" />
          Create company
        </Button>
      </div>

      <DataTable
        columns={companyColumns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSortChange={setSort}
        onRowClick={(row) => router.push(`/companies/${row.id}`)}
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        isLoading={isLoading}
      />

      <EntityFormModal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateError(null);
        }}
        title="Create company"
        onSubmit={() => formRef.current?.submit()}
        isLoading={isCreating}
      >
        {createError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {createError}
          </div>
        )}
        <CompanyForm
          ref={formRef}
          onSubmit={handleCreate}
          isLoading={isCreating}
        />
      </EntityFormModal>
    </div>
  );
}
