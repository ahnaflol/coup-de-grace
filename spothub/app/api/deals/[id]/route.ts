import { getById, update, remove } from "@/lib/storage";
import type { Deal } from "@/types";

const FILENAME = "deals.json";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deal = await getById<Deal>(FILENAME, id);
  if (!deal) {
    return Response.json({ error: "Not found", message: "Deal not found", statusCode: 404 }, { status: 404 });
  }
  return Response.json(deal);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updated = await update<Deal>(FILENAME, id, body);
  if (!updated) {
    return Response.json({ error: "Not found", message: "Deal not found", statusCode: 404 }, { status: 404 });
  }
  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await remove(FILENAME, id);
  if (!deleted) {
    return Response.json({ error: "Not found", message: "Deal not found", statusCode: 404 }, { status: 404 });
  }
  return Response.json({ success: true });
}
