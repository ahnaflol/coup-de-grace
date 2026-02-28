import { getById, update, remove } from "@/lib/storage";
import type { Company } from "@/types";

const FILENAME = "companies.json";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const company = await getById<Company>(FILENAME, id);
  if (!company) {
    return Response.json({ error: "Not found", message: "Company not found", statusCode: 404 }, { status: 404 });
  }
  return Response.json(company);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updated = await update<Company>(FILENAME, id, body);
  if (!updated) {
    return Response.json({ error: "Not found", message: "Company not found", statusCode: 404 }, { status: 404 });
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
    return Response.json({ error: "Not found", message: "Company not found", statusCode: 404 }, { status: 404 });
  }
  return Response.json({ success: true });
}
