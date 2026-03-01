import { db } from "../db";
import { extractedRows } from "../db/schema";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const compiledOutputSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  normalizedCount: z.number(),
});

type CompiledOutput = z.infer<typeof compiledOutputSchema>;

/**
 * Checks if extracted rows have inconsistent columns across tasks.
 * Returns true if compilation is needed.
 */
export function hasInconsistentColumns(
  rows: Record<string, string>[],
): boolean {
  if (rows.length <= 1) return false;

  const firstKeySet = Object.keys(rows[0]).sort().join(",");
  for (let i = 1; i < rows.length; i++) {
    if (Object.keys(rows[i]).sort().join(",") !== firstKeySet) return true;
  }
  return false;
}

/**
 * Simple programmatic normalization without LLM.
 * Collects all unique keys across rows and fills missing values with empty strings.
 */
function programmaticNormalize(
  rows: Record<string, string>[],
): CompiledOutput {
  const allKeys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      allKeys.add(key);
    }
  }
  const headers = Array.from(allKeys).sort();

  const normalizedRows = rows.map((row) =>
    headers.map((h) => row[h] ?? ""),
  );

  return {
    headers,
    rows: normalizedRows,
    normalizedCount: rows.length,
  };
}

/**
 * Compiles extraction results for a plan.
 * Uses Sonnet LLM when available for intelligent normalization,
 * falls back to simple programmatic normalization otherwise.
 */
export async function compileExtractionResults(
  planId: string,
  expectedColumns?: string[],
): Promise<CompiledOutput> {
  // Fetch id + data together in a single ordered query for consistent pairing
  const allRowRecords = await db
    .select({ id: extractedRows.id, data: extractedRows.data })
    .from(extractedRows)
    .where(eq(extractedRows.planId, planId))
    .orderBy(asc(extractedRows.createdAt));

  const rawRows = allRowRecords.map(
    (r) => r.data as Record<string, string>,
  );

  if (rawRows.length === 0) {
    return { headers: expectedColumns ?? [], rows: [], normalizedCount: 0 };
  }

  // Skip normalization if columns are already consistent
  if (!hasInconsistentColumns(rawRows)) {
    console.log(`[compiler] Columns already consistent, skipping normalization | planId=${planId}`);
    return programmaticNormalize(rawRows);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(
      `[compiler] No ANTHROPIC_API_KEY, using programmatic normalization | planId=${planId}`,
    );
    return programmaticNormalize(rawRows);
  }

  try {
    const prompt = [
      "Normalize the following extracted data rows into a consistent tabular format.",
      expectedColumns
        ? `Expected columns: ${expectedColumns.join(", ")}`
        : "Infer the best column headers from the data.",
      "Standardize column names (e.g., 'Phone Number' and 'Phone' should become one column).",
      "Fill missing values with empty strings.",
      "",
      "Raw data:",
      JSON.stringify(rawRows, null, 2),
    ].join("\n");

    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system:
        "You are a data normalization assistant. Given raw extracted rows with potentially inconsistent column names, normalize them into a clean tabular format.",
      prompt,
      output: Output.object({ schema: compiledOutputSchema }),
    });

    if (!output) {
      console.log(`[compiler] LLM returned no output, falling back to programmatic | planId=${planId}`);
      return programmaticNormalize(rawRows);
    }

    console.log(
      `[compiler] Normalized ${output.normalizedCount} rows | planId=${planId}`,
    );

    // Update extracted rows with normalized data (parallel batch)
    await Promise.all(
      allRowRecords
        .slice(0, output.rows.length)
        .map((record, i) => {
          const normalizedData: Record<string, string> = {};
          for (let j = 0; j < output.headers.length; j++) {
            normalizedData[output.headers[j]] = output.rows[i]?.[j] ?? "";
          }
          return db
            .update(extractedRows)
            .set({ data: normalizedData })
            .where(eq(extractedRows.id, record.id));
        }),
    );

    return output;
  } catch (err) {
    console.error(
      `[compiler] LLM compilation failed, falling back to programmatic | planId=${planId}`,
      err,
    );
    return programmaticNormalize(rawRows);
  }
}
