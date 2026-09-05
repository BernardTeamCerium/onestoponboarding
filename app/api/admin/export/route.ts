import { isSignedIn } from "@/lib/adminAuth";
import { isDbConfigured, listSubmissions } from "@/lib/db";
import { ALL_FIELDS } from "@/lib/questionnaire";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cell(value: unknown): string {
  const text = Array.isArray(value)
    ? value.join("; ")
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : value == null
        ? ""
        : String(value);
  // Escape for CSV, and neutralise anything a spreadsheet would treat as a formula.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isSignedIn())) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!isDbConfigured()) {
    return new Response("No database configured.", { status: 503 });
  }

  const rows = await listSubmissions(5000);
  const header = ["Submitted", "Platform reference", ...ALL_FIELDS.map((field) => field.label)];

  const lines = [
    header.map(cell).join(","),
    ...rows.map((row) =>
      [
        cell(row.created_at.toISOString()),
        cell(row.external_ref),
        ...ALL_FIELDS.map((field) => cell(row.answers[field.name])),
      ].join(","),
    ),
  ];

  const stamp = new Date().toISOString().slice(0, 10);
  // The BOM keeps Excel happy with the ® and – characters in the answers.
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="onboarding-submissions-${stamp}.csv"`,
    },
  });
}
