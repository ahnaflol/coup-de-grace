"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { usePlanningStore } from "@/stores/use-planning-store";
import { Upload, X, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropZone() {
  const { uploadedFiles, addFile, removeFile } = usePlanningStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        addFile({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
        });
      });
    },
    [addFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
    },
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary-muted"
            : "border-border hover:border-primary/40 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            "h-8 w-8",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )}
        />
        <div>
          <p className="text-sm font-medium">
            {isDragActive
              ? "Drop files here"
              : "Drop files or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JSON, TXT, or CSV files (Claude transcripts, data files)
          </p>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploadedFiles.map((file) => (
            <Badge
              key={file.id}
              variant="secondary"
              className="gap-1.5 pr-1"
            >
              <FileText className="h-3 w-3" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <span className="text-muted-foreground">
                {formatSize(file.size)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
