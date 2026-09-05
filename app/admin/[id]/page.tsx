import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdminConfigured, isSignedIn } from "@/lib/adminAuth";
import { isDbConfigured, getSubmission } from "@/lib/db";
import { STEPS } from "@/lib/questionnaire";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: `Submission | ${site.company}`, robots: { index: false } };

function asText(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value == null ? "" : String(value);
}

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isAdminConfigured() || !(await isSignedIn())) notFound();
  if (!isDbConfigured()) notFound();

  const { id } = await params;
  const row = await getSubmission(id);
  if (!row) notFound();

  const name = `${row.first_name} ${row.last_name}`.trim();
  const submitted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(row.created_at);

  return (
    <div className="admin">
      <p className="admin-back">
        <Link href="/admin">← All submissions</Link>
      </p>

      <header className="admin-top">
        <div>
          <span className="admin-eyebrow">{submitted}</span>
          <h1>{name || "Submission"}</h1>
          <p className="admin-sub">{row.firm_name}</p>
        </div>
        <div className="admin-actions">
          <a className="btn btn-primary btn-sm" href={`mailto:${row.email}`}>
            Email
          </a>
          <a className="btn btn-ghost btn-sm" href={`tel:${row.phone}`}>
            Call
          </a>
        </div>
      </header>

      {row.external_ref ? (
        <p className="admin-count">
          Platform reference · <strong>{row.external_ref}</strong>
        </p>
      ) : null}

      {row.ghl_delivered ? (
        <p className="admin-count">
          Sent to GoHighLevel{row.ghl_contact_id ? ` · contact ${row.ghl_contact_id}` : ""}
        </p>
      ) : null}

      {STEPS.map((step) => {
        const rows = step.fields
          .map(
            (field) =>
              [
                // The consent label is a full legal paragraph — too long for a term.
                field.type === "consent" ? "Email & SMS consent" : field.label,
                asText(row.answers[field.name]),
              ] as const,
          )
          .filter(([, value]) => value !== "");
        if (rows.length === 0) return null;

        return (
          <section className="admin-section" key={step.id}>
            <h2>{step.title}</h2>
            <dl className="admin-dl">
              {rows.map(([label, value]) => (
                <div className="admin-dl-row" key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}

      {Object.keys(row.meta ?? {}).length > 0 ? (
        <section className="admin-section">
          <h2>Source</h2>
          <dl className="admin-dl">
            {Object.entries(row.meta).map(([key, value]) => (
              <div className="admin-dl-row" key={key}>
                <dt>{key}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
