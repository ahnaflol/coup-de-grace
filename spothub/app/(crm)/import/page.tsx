"use client";

import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const SAMPLE_CSV = `firstName,lastName,email,phone,companyName,lifecycleStage,jobTitle,city,state
John,Doe,john@example.com,555-0101,Acme Corp,lead,Engineer,Austin,TX
Jane,Smith,jane@example.com,555-0102,"Smith, Jones & Co",customer,Director,Boston,MA
Bob,Wilson,bob@example.com,555-0103,TechStart Inc,opportunity,Manager,Denver,CO
Alice,Brown,alice@example.com,555-0104,"Lee, Park & Associates",lead,Analyst,Seattle,WA
Charlie,Davis,charlie@example.com,555-0105,GlobalTech,subscriber,Developer,Portland,OR`;

export default function ImportPage() {
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      setFileName(file.name);

      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length > 0) {
        const headerRow = lines[0].split(",").map((h) => h.trim());
        setHeaders(headerRow);

        const dataRows = lines.slice(1, 6).map((line) =>
          line.split(",").map((v) => v.trim())
        );
        setPreviewRows(dataRows);
      }
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFileSelect(file);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  async function handleImport() {
    if (!csvContent) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Import failed");
      }

      const data = await response.json();
      // SH-SEED-009 (intentional): swap imported/total in the UI success banner.
      setResult({ imported: data.total, total: data.imported });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetForm() {
    setCsvContent(null);
    setFileName(null);
    setPreviewRows([]);
    setHeaders([]);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Contacts</h1>
        <p className="text-muted-foreground mt-1">
          Upload a CSV file to bulk import contacts into SpotHub.
        </p>
      </div>

      {result && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <Check className="size-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              {result.imported} of {result.total} rows imported successfully
            </p>
            {result.imported < result.total && (
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {result.total - result.imported} rows were skipped due to
                missing or invalid data.
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Drag and drop a .csv file or click to browse. The first row should
            contain column headers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 cursor-pointer hover:border-muted-foreground/50 transition-colors"
          >
            {fileName ? (
              <>
                <FileSpreadsheet className="size-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {previewRows.length} data rows detected
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); resetForm(); }}>
                  Choose Different File
                </Button>
              </>
            ) : (
              <>
                <Upload className="size-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">
                    Drop your CSV file here, or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports .csv files
                  </p>
                </div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          {previewRows.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Preview (first {previewRows.length} rows)
              </p>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      {headers.map((header, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-left font-medium whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-t">
                        {headers.map((_, colIdx) => (
                          <td
                            key={colIdx}
                            className="px-3 py-2 whitespace-nowrap"
                          >
                            {row[colIdx] || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-3">
          <Button onClick={handleImport} disabled={!csvContent || importing}>
            {importing ? "Importing..." : "Import Contacts"}
          </Button>
          {csvContent && (
            <Button variant="outline" onClick={resetForm}>
              Clear
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSV Template</CardTitle>
          <CardDescription>
            Download a sample template with the correct column headers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border bg-muted/30 p-4">
            <pre className="text-xs whitespace-pre">{SAMPLE_CSV}</pre>
          </div>
          <p className="text-sm text-muted-foreground">
            Required columns: firstName, lastName, email. All other columns are
            optional.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="size-4" />
            Download Template
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
