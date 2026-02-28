"use client";

import { type ColumnDef } from "@tanstack/react-table";
import type { Company } from "@/types";
import { formatCurrency, formatDate, formatSnakeCase } from "@/lib/formatters";

export const companyColumns: ColumnDef<Company, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const company = row.original;
      return (
        <div>
          <p className="font-medium">{company.name}</p>
          <p className="text-sm text-muted-foreground">{company.domain}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "industry",
    header: "Industry",
    cell: ({ row }) => formatSnakeCase(row.original.industry),
  },
  {
    accessorKey: "size",
    header: "Size",
  },
  {
    accessorKey: "annualRevenue",
    header: "Revenue",
    cell: ({ row }) => formatCurrency(row.original.annualRevenue),
  },
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => row.original.city || "--",
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];
