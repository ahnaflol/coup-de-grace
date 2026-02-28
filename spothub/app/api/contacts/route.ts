import { getAll, create, filterItems, applyFilters, sortItems, paginate } from "@/lib/storage";
import type { Contact } from "@/types";

const FILENAME = "contacts.json";
const SEARCH_FIELDS = ["firstName", "lastName", "email", "companyName"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "25");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
  const search = searchParams.get("search") || "";

  const filters: Record<string, string> = {};
  const lifecycleStage = searchParams.get("lifecycleStage");
  if (lifecycleStage) filters.lifecycleStage = lifecycleStage;
  const owner = searchParams.get("owner");
  if (owner) filters.owner = owner;

  let items = await getAll<Contact>(FILENAME);
  items = filterItems(items, search, SEARCH_FIELDS);
  items = applyFilters(items, filters);
  items = sortItems(items, sortBy, sortOrder);
  const result = paginate(items, page, pageSize);
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const contact = await create<Contact>(FILENAME, body);
  return Response.json(contact, { status: 201 });
}
