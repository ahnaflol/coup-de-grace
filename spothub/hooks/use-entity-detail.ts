"use client";

import { useState, useEffect, useCallback } from "react";
import type { Activity } from "@/types";

const PLURAL_TO_SINGULAR: Record<string, string> = {
  contacts: "contact",
  companies: "company",
  deals: "deal",
  tickets: "ticket",
};

interface UseEntityDetailReturn<T> {
  entity: T | null;
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  updateEntity: (updates: Partial<T>) => Promise<void>;
}

export function useEntityDetail<T = Record<string, unknown>>(
  entityType: string,
  id: string
): UseEntityDetailReturn<T> {
  const [entity, setEntity] = useState<T | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const singularType = PLURAL_TO_SINGULAR[entityType] ?? entityType;

        const [entityRes, activitiesRes] = await Promise.all([
          fetch(`/api/${entityType}/${id}`),
          fetch(`/api/activities?entityType=${singularType}&entityId=${id}`),
        ]);

        if (!entityRes.ok) throw new Error("Failed to fetch entity");

        const entityData = await entityRes.json();
        const activitiesData = activitiesRes.ok ? await activitiesRes.json() : [];

        if (!cancelled) {
          setEntity(entityData);
          setActivities(Array.isArray(activitiesData) ? activitiesData : activitiesData.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (id) fetchData();
    return () => {
      cancelled = true;
    };
  }, [entityType, id, refreshKey]);

  const updateEntity = useCallback(
    async (updates: Partial<T>) => {
      const response = await fetch(`/api/${entityType}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update entity");
      refresh();
    },
    [entityType, id, refresh]
  );

  return {
    entity,
    activities,
    isLoading,
    error,
    refresh,
    updateEntity,
  };
}
