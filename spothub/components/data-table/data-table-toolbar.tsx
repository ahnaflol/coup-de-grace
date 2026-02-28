"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";

interface FilterOption {
  id: string;
  title: string;
  options: { label: string; value: string }[];
}

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterOptions: FilterOption[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  filterOptions,
  activeFilters,
  onFilterChange,
}: DataTableToolbarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (debouncedSearch !== searchValue) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, searchValue, onSearchChange]);

  const hasActiveFilters = Object.values(activeFilters).some(
    (values) => values.length > 0
  );

  // BUG (intentional): Reset clears all filters EXCEPT lifecycleStage persists in URL
  function handleReset() {
    setLocalSearch("");
    onSearchChange("");
    for (const filter of filterOptions) {
      if (filter.id === "lifecycleStage") continue;
      onFilterChange(filter.id, []);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 py-4">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-64">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {filterOptions.map((filter) => (
          <DataTableFacetedFilter
            key={filter.id}
            title={filter.title}
            options={filter.options}
            selectedValues={activeFilters[filter.id] ?? []}
            onSelect={(values) => onFilterChange(filter.id, values)}
          />
        ))}
        {(hasActiveFilters || localSearch) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 px-2"
          >
            Reset
            <X className="ml-1 size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
