"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Deal } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/formatters";

export const dealColumns: ColumnDef<Deal, unknown>[] = [
  {
    accessorKey: "name",
    header: "Deal Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.getValue("amount")),
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => (
      <StatusBadge variant="deal" value={row.getValue("stage")} />
    ),
  },
  {
    accessorKey: "closeDate",
    header: "Close Date",
    cell: ({ row }) => formatDate(row.getValue("closeDate")),
  },
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => row.getValue("companyName") || "--",
  },
  {
    accessorKey: "contactName",
    header: "Contact",
    cell: ({ row }) => row.getValue("contactName") || "--",
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <StatusBadge variant="ticket_priority" value={row.getValue("priority")} />
    ),
  },
];
