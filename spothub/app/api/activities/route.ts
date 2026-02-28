import { getAll } from "@/lib/storage";
import type { Activity } from "@/types";

const FILENAME = "activities.json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const type = searchParams.get("type");

  if (!entityType || !entityId) {
    return Response.json(
      { error: "Bad request", message: "entityType and entityId are required", statusCode: 400 },
      { status: 400 }
    );
  }

  let items = await getAll<Activity>(FILENAME);
  items = items.filter((a) => a.entityType === entityType && a.entityId === entityId);
  if (type) {
    items = items.filter((a) => a.type === type);
  }
  items.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

  return Response.json(items);
}
