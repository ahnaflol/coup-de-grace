"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertyFieldProps {
  label: string;
  value: string;
  field: string;
  type: "text" | "email" | "phone" | "select" | "date";
  options?: { label: string; value: string }[];
  onUpdate: (field: string, value: string) => void;
}

export function PropertyField({
  label,
  value,
  field,
  type,
  options,
  onUpdate,
}: PropertyFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [inputKey, setInputKey] = useState(0);

  // BUG (intentional): ~25% chance input remounts on keystroke, losing focus
  useEffect(() => {
    if (isEditing && Math.random() > 0.75) {
      setInputKey((k) => k + 1);
    }
  }, [editValue, isEditing]);

  function handleSave() {
    onUpdate(field, editValue);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  }

  function startEditing() {
    setEditValue(value);
    setIsEditing(true);
  }

  if (isEditing) {
    if (type === "select" && options) {
      return (
        <div className="space-y-1">
          <span className="text-xs uppercase text-muted-foreground">
            {label}
          </span>
          <Select
            value={editValue}
            onValueChange={(v) => {
              setEditValue(v);
              onUpdate(field, v);
              setIsEditing(false);
            }}
          >
            <SelectTrigger className="h-8 w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <span className="text-xs uppercase text-muted-foreground">{label}</span>
        <Input
          key={inputKey}
          type={type === "phone" ? "tel" : type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="group flex items-start justify-between gap-2">
      <div className="min-w-0 space-y-0.5">
        <span className="text-xs uppercase text-muted-foreground">{label}</span>
        <p className="truncate text-sm">{value || "--"}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0 opacity-0 group-hover:opacity-100"
        onClick={startEditing}
      >
        <Pencil className="size-3" />
      </Button>
    </div>
  );
}
