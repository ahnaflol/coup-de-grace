import { create } from "@/lib/storage";
import { OWNERS } from "@/lib/constants";
import type { Contact, LifecycleStage } from "@/types";

const FILENAME = "contacts.json";

const VALID_LIFECYCLE_STAGES: LifecycleStage[] = [
  "subscriber",
  "lead",
  "marketing_qualified",
  "sales_qualified",
  "opportunity",
  "customer",
  "evangelist",
];

const CSV_HEADERS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "companyName",
  "lifecycleStage",
  "jobTitle",
  "city",
  "state",
] as const;

// BUG-07: Naive CSV parser that splits by comma without handling quoted fields.
// Fields containing commas (e.g. "Smith, Jones & Co") will be split incorrectly,
// causing the row to have the wrong number of columns and get silently skipped.
function parseCSVLine(line: string): string[] {
  return line.split(",").map((s) => s.trim());
}

export async function POST(request: Request) {
  const body = await request.json();
  const { csv } = body as { csv: string };

  if (!csv || typeof csv !== "string") {
    return Response.json({ error: "CSV string is required" }, { status: 400 });
  }

  const lines = csv
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return Response.json(
      { error: "CSV must contain a header row and at least one data row" },
      { status: 400 }
    );
  }

  const headers = parseCSVLine(lines[0]);
  const dataLines = lines.slice(1);
  const total = dataLines.length;
  let imported = 0;

  for (const line of dataLines) {
    const values = parseCSVLine(line);

    // BUG-07: If a field contains a comma, the naive split produces extra columns.
    // The row will have more values than headers, causing the column mapping to be wrong.
    // Rows with fewer or more values than expected headers are silently skipped.
    if (values.length !== headers.length) {
      continue;
    }

    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i];
    }

    if (!row.firstName || !row.lastName || !row.email) {
      continue;
    }

    const lifecycleStage = VALID_LIFECYCLE_STAGES.includes(
      row.lifecycleStage as LifecycleStage
    )
      ? (row.lifecycleStage as LifecycleStage)
      : "lead";

    const randomOwner = OWNERS[Math.floor(Math.random() * OWNERS.length)];

    const contactData: Omit<Contact, "id" | "createdAt" | "updatedAt"> = {
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone || "",
      companyId: null,
      companyName: row.companyName || null,
      lifecycleStage,
      owner: randomOwner.name,
      lastActivityDate: null,
      jobTitle: row.jobTitle || "",
      city: row.city || "",
      state: row.state || "",
      tags: [],
    };

    await create<Contact>(FILENAME, contactData);
    imported++;
  }

  return Response.json({ imported, total });
}
