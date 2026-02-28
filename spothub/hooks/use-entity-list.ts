"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { PaginatedResponse } from "@/types/api";

interface UseEntityListReturn<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  search: string;
  filters: Record<string, string>;
  sortBy: string;
  sortOrder: "asc" | "desc";
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
  setSearch: (search: string) => void;
  setFilters: (filters: Record<string, string>) => void;
  refresh: () => void;
}

export function useEntityList<T = Record<string, unknown>>(
  entityType: string
): UseEntityListReturn<T> {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
  const search = searchParams.get("search") || "";

  const filtersFromParams = (): Record<string, string> => {
    const result: Record<string, string> = {};
    const reserved = new Set(["page", "pageSize", "sortBy", "sortOrder", "search"]);
    searchParams.forEach((value, key) => {
      if (!reserved.has(key)) {
        result[key] = value;
      }
    });
    return result;
  };

  const filters = filtersFromParams();
  const debouncedSearch = useDebounce(search, 300);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const setPage = useCallback(
    (newPage: number) => updateParams({ page: String(newPage) }),
    [updateParams]
  );

  const setPageSize = useCallback(
    (newPageSize: number) => updateParams({ pageSize: String(newPageSize), page: "1" }),
    [updateParams]
  );

  const setSort = useCallback(
    (newSortBy: string, newSortOrder: "asc" | "desc") =>
      updateParams({ sortBy: newSortBy, sortOrder: newSortOrder, page: "1" }),
    [updateParams]
  );

  const setSearch = useCallback(
    (newSearch: string) => updateParams({ search: newSearch || undefined, page: "1" }),
    [updateParams]
  );

  const setFilters = useCallback(
    (newFilters: Record<string, string>) => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (search) params.set("search", search);
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [pageSize, sortBy, sortOrder, search, router]
  );

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          sortBy,
          sortOrder,
        });
        if (debouncedSearch) params.set("search", debouncedSearch);
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });

        const response = await fetch(`/api/${entityType}?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const result: PaginatedResponse<T> = await response.json();

        if (!cancelled) {
          setData(result.data);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        }
      } catch {
        if (!cancelled) {
          setData([]);
          setTotal(0);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, page, pageSize, sortBy, sortOrder, debouncedSearch, refreshKey]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    search,
    filters,
    sortBy,
    sortOrder,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    refresh,
  };
}
