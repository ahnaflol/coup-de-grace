"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Building2, DollarSign, Ticket } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import type { SearchResult } from "@/types/api";

const TYPE_CONFIG = {
  contact: { label: "Contacts", icon: Users },
  company: { label: "Companies", icon: Building2 },
  deal: { label: "Deals", icon: DollarSign },
  ticket: { label: "Tickets", icon: Ticket },
} as const;

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    // BUG (intentional): no loading state shown while fetching
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data: SearchResult[]) => setResults(data))
      .catch(() => setResults([]));
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");
      setResults([]);
      router.push(`/${result.type}s/${result.id}`);
    },
    [router]
  );

  const grouped = results.reduce<Record<string, SearchResult[]>>(
    (acc, result) => {
      if (!acc[result.type]) acc[result.type] = [];
      acc[result.type].push(result);
      return acc;
    },
    {}
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-72 items-center rounded-md border bg-slate-50 px-3 text-sm text-slate-400 hover:bg-slate-100"
      >
        <Search className="mr-2 size-4" />
        <span>Search SpotHub...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-0.5 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 sm:flex">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setQuery("");
            setResults([]);
          }
        }}
        title="Search SpotHub"
        description="Search across contacts, companies, deals, and tickets"
        showCloseButton={false}
      >
        <CommandInput
          placeholder="Search contacts, companies, deals, tickets..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {debouncedQuery.trim()
              ? "No results found."
              : "Start typing to search..."}
          </CommandEmpty>
          {Object.entries(grouped).map(([type, items]) => {
            const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
            const Icon = config.icon;
            return (
              <CommandGroup key={type} heading={config.label}>
                {items.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={`${result.title} ${result.subtitle}`}
                    onSelect={() => handleSelect(result)}
                  >
                    <Icon className="mr-2 size-4 text-slate-400" />
                    <div className="flex flex-col">
                      <span className="text-sm">{result.title}</span>
                      <span className="text-xs text-slate-400">
                        {result.subtitle}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
