"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Ticket } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatSnakeCase } from "@/lib/formatters";

export const ticketColumns: ColumnDef<Ticket, unknown>[] = [
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("subject")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant="ticket_status" value={row.getValue("status")} />
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <StatusBadge variant="ticket_priority" value={row.getValue("priority")} />
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => formatSnakeCase(row.getValue("category")),
  },
  {
    accessorKey: "contactName",
    header: "Contact",
    cell: ({ row }) => row.getValue("contactName") || "--",
  },
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => row.getValue("companyName") || "--",
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
];
