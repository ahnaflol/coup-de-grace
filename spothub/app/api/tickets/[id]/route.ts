import { getById, update, remove } from "@/lib/storage";
import type { Ticket } from "@/types";

const FILENAME = "tickets.json";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await getById<Ticket>(FILENAME, id);
  if (!ticket) {
    return Response.json({ error: "Not found", message: "Ticket not found", statusCode: 404 }, { status: 404 });
  }
  return Response.json(ticket);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updated = await update<Ticket>(FILENAME, id, body);
  if (!updated) {
    return Response.json({ error: "Not found", message: "Ticket not found", statusCode: 404 }, { status: 404 });
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
    return Response.json({ error: "Not found", message: "Ticket not found", statusCode: 404 }, { status: 404 });
  }
  return Response.json({ success: true });
}
