import { getById, update, remove } from "@/lib/storage";
import type { Contact } from "@/types";

const FILENAME = "contacts.json";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contact = await getById<Contact>(FILENAME, id);
  if (!contact) {
    return Response.json({ error: "Not found", message: "Contact not found", statusCode: 404 }, { status: 404 });
  }
  return Response.json(contact);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updated = await update<Contact>(FILENAME, id, body);
  if (!updated) {
    return Response.json({ error: "Not found", message: "Contact not found", statusCode: 404 }, { status: 404 });
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
    return Response.json({ error: "Not found", message: "Contact not found", statusCode: 404 }, { status: 404 });
  }
  return Response.json({ success: true });
}
