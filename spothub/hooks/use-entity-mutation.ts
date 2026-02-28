"use client";

import { useState, useCallback } from "react";

interface UseEntityMutationReturn<T> {
  createEntity: (data: Partial<T>) => Promise<T>;
  updateEntity: (id: string, data: Partial<T>) => Promise<T>;
  deleteEntity: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function useEntityMutation<T = Record<string, unknown>>(
  entityType: string
): UseEntityMutationReturn<T> {
  const [isLoading, setIsLoading] = useState(false);

  const createEntity = useCallback(
    async (data: Partial<T>): Promise<T> => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/${entityType}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to create entity");
        return await response.json();
      } finally {
        setIsLoading(false);
      }
    },
    [entityType]
  );

  const updateEntity = useCallback(
    async (id: string, data: Partial<T>): Promise<T> => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/${entityType}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update entity");
        return await response.json();
      } finally {
        setIsLoading(false);
      }
    },
    [entityType]
  );

  const deleteEntity = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/${entityType}/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete entity");
      } finally {
        setIsLoading(false);
      }
    },
    [entityType]
  );

  return {
    createEntity,
    updateEntity,
    deleteEntity,
    isLoading,
  };
}
