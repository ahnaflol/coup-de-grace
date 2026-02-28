"use client";

import { type ColumnDef } from "@tanstack/react-table";
import type { Contact } from "@/types";
import { AvatarInitials } from "@/components/shared/avatar-initials";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelativeDate, formatDate } from "@/lib/formatters";

export const contactColumns: ColumnDef<Contact, unknown>[] = [
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => {
      const contact = row.original;
      const fullName = `${contact.firstName} ${contact.lastName}`;
      return (
        <div className="flex items-center gap-3">
          <AvatarInitials name={fullName} size="sm" />
          <div>
            <p className="font-medium">{fullName}</p>
            <p className="text-sm text-muted-foreground">{contact.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => row.original.companyName || "--",
  },
  {
    accessorKey: "lifecycleStage",
    header: "Lifecycle Stage",
    cell: ({ row }) => (
      <StatusBadge
        variant="lifecycle"
        value={row.original.lifecycleStage}
      />
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.original.phone || "--",
  },
  {
    accessorKey: "lastActivityDate",
    header: "Last Activity",
    cell: ({ row }) => formatRelativeDate(row.original.lastActivityDate),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];
