"use client";

import { type Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  sortBy,
  sortOrder,
  onSortChange,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const columnId = column.id;
  const isActive = sortBy === columnId;

  function handleClick() {
    if (isActive) {
      onSortChange(columnId, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange(columnId, "asc");
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={handleClick}
    >
      <span>{title}</span>
      <SortIcon isActive={isActive} sortOrder={sortOrder} />
    </Button>
  );
}

function SortIcon({ isActive, sortOrder }: { isActive: boolean; sortOrder: "asc" | "desc" }) {
  if (!isActive) {
    return <ArrowUpDown className="ml-1 size-3.5" />;
  }
  if (sortOrder === "asc") {
    return <ArrowUp className="ml-1 size-3.5" />;
  }
  return <ArrowDown className="ml-1 size-3.5" />;
}
