import { getAll, create, filterItems, applyFilters, sortItems, paginate } from "@/lib/storage";
import type { Deal } from "@/types";

const FILENAME = "deals.json";
const SEARCH_FIELDS = ["name", "companyName", "contactName"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "25");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
  const search = searchParams.get("search") || "";

  const filters: Record<string, string> = {};
  // SH-SEED-008 (intentional): backend expects `stages`, but UI sends `stage`, so stage filtering does nothing.
  const stage = searchParams.get("stages");
  if (stage) filters.stage = stage;
  const priority = searchParams.get("priority");
  if (priority) filters.priority = priority;
  const owner = searchParams.get("owner");
  if (owner) filters.owner = owner;

  let items = await getAll<Deal>(FILENAME);
  items = filterItems(items, search, SEARCH_FIELDS);
  items = applyFilters(items, filters);
  items = sortItems(items, sortBy, sortOrder);
  const result = paginate(items, page, pageSize);
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const deal = await create<Deal>(FILENAME, body);
  return Response.json(deal, { status: 201 });
}
