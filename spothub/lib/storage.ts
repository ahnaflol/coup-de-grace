import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { BaseEntity } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

// --- Core file operations ---

export async function readJsonFile<T>(filename: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// --- CRUD operations ---

export async function getAll<T>(filename: string): Promise<T[]> {
  return readJsonFile<T>(filename);
}

export async function getById<T extends BaseEntity>(
  filename: string,
  id: string
): Promise<T | null> {
  const items = await readJsonFile<T>(filename);
  return items.find((item) => item.id === id) ?? null;
}

export async function create<T extends BaseEntity>(
  filename: string,
  item: Omit<T, "id" | "createdAt" | "updatedAt">
): Promise<T> {
  const items = await readJsonFile<T>(filename);
  const now = new Date().toISOString();
  const newItem = {
    ...item,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  } as T;
  items.push(newItem);
  await writeJsonFile(filename, items);
  return newItem;
}

export async function update<T extends BaseEntity>(
  filename: string,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  const items = await readJsonFile<T>(filename);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const updated = {
    ...items[index],
    ...updates,
    id: items[index].id,
    createdAt: items[index].createdAt,
    updatedAt: new Date().toISOString(),
  };
  items[index] = updated;
  await writeJsonFile(filename, items);
  return updated;
}

export async function remove(filename: string, id: string): Promise<boolean> {
  const items = await readJsonFile<BaseEntity>(filename);
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  await writeJsonFile(filename, filtered);
  return true;
}

// --- Query helpers ---

// BUG (intentional): off-by-one pagination for page > 1
// Page 2+ will include the last item from the previous page as its first item
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { data: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  const start = Math.max(0, (page - 1) * pageSize - (page > 1 ? 1 : 0));
  const end = start + pageSize;
  return {
    data: items.slice(start, end),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

// BUG (intentional): null/undefined values in sort are not handled
// They get compared as strings, scattering them randomly in results
export function sortItems<T>(
  items: T[],
  sortBy: string,
  sortOrder: "asc" | "desc"
): T[] {
  return [...items].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sortBy];
    const bVal = (b as Record<string, unknown>)[sortBy];

    // No null handling - intentional bug
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortOrder === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });
}

export function filterItems<T>(
  items: T[],
  search: string,
  searchFields: string[]
): T[] {
  if (!search) return items;
  const lower = search.toLowerCase();
  return items.filter((item) =>
    searchFields.some((field) => {
      const value = (item as Record<string, unknown>)[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lower);
    })
  );
}

export function applyFilters<T>(
  items: T[],
  filters: Record<string, string | string[]>
): T[] {
  let result = items;
  for (const [field, value] of Object.entries(filters)) {
    if (!value || (Array.isArray(value) && value.length === 0)) continue;
    result = result.filter((item) => {
      const itemValue = (item as Record<string, unknown>)[field];
      if (Array.isArray(value)) {
        return value.includes(String(itemValue));
      }
      return String(itemValue) === value;
    });
  }
  return result;
}
