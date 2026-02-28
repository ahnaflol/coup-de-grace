import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readJsonFile, writeJsonFile } from "@/lib/storage";
import type { Note } from "@/types/notes";

const NOTES_FILE = "notes.json";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: "entityType and entityId are required" },
      { status: 400 }
    );
  }

  const notes = await readJsonFile<Note>(NOTES_FILE);
  const filtered = notes
    .filter((n) => n.entityType === entityType && n.entityId === entityId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { entityType, entityId, content, createdBy } = body;

  if (!entityType || !entityId || !content || !createdBy) {
    return NextResponse.json(
      { error: "entityType, entityId, content, and createdBy are required" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const note: Note = {
    id: uuidv4(),
    entityType,
    entityId,
    content: content.slice(0, 500),
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const notes = await readJsonFile<Note>(NOTES_FILE);
  notes.push(note);
  await writeJsonFile(NOTES_FILE, notes);

  return NextResponse.json(note, { status: 201 });
}
