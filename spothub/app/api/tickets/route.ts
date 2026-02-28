import { getAll, create, filterItems, applyFilters, sortItems, paginate } from "@/lib/storage";
import type { Ticket } from "@/types";

const FILENAME = "tickets.json";
const SEARCH_FIELDS = ["subject", "contactName", "companyName"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "25");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
  const search = searchParams.get("search") || "";

  const filters: Record<string, string> = {};
  const status = searchParams.get("status");
  if (status) filters.status = status;
  const priority = searchParams.get("priority");
  if (priority) filters.priority = priority;
  const category = searchParams.get("category");
  if (category) filters.category = category;
  const owner = searchParams.get("owner");
  if (owner) filters.owner = owner;

  let items = await getAll<Ticket>(FILENAME);
  items = filterItems(items, search, SEARCH_FIELDS);
  items = applyFilters(items, filters);
  items = sortItems(items, sortBy, sortOrder);
  const result = paginate(items, page, pageSize);
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const ticket = await create<Ticket>(FILENAME, body);
  return Response.json(ticket, { status: 201 });
}
