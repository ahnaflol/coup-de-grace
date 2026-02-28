"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Note } from "@/types/notes";

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface NotesSectionProps {
  entityType: string;
  entityId: string;
}

export function NotesSection({ entityType, entityId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/notes?entityType=${entityType}&entityId=${entityId}`
      );
      if (res.ok) {
        const data: Note[] = await res.json();
        setNotes(data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleAddNote() {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          content,
          createdBy: "John Doe",
        }),
      });
      if (res.ok) {
        setContent("");
        await fetchNotes();
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button
            size="sm"
            onClick={handleAddNote}
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? "Adding..." : "Add Note"}
          </Button>
        </div>

        <Separator />

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note, index) => (
              <div key={note.id}>
                <p className="text-sm">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  By {note.createdBy} - {formatRelativeDate(note.createdAt)}
                </p>
                {index < notes.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
