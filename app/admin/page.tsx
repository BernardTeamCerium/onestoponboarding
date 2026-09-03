import Link from "next/link";
import AdminLogin from "@/components/AdminLogin";
import { isAdminConfigured, isSignedIn } from "@/lib/adminAuth";
import { isDbConfigured, listSubmissions, countSubmissions } from "@/lib/db";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: `Submissions | ${site.company}`, robots: { index: false } };

function AdminShell({ children }: { children: React.ReactNode }) {
  return <div className="admin">{children}</div>;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function AdminPage() {
  if (!isAdminConfigured()) {
    return (
      <AdminShell>
        <div className="admin-notice">
          <h1>Dashboard not configured</h1>
          <p>
            Set <code>ADMIN_PASSWORD</code> in your environment variables to enable this page, then
            redeploy.
          </p>
        </div>
      </AdminShell>
    );
  }

  if (!(await isSignedIn())) {
    return (
      <AdminShell>
        <AdminLogin />
      </AdminShell>
    );
  }

  if (!isDbConfigured()) {
    return (
      <AdminShell>
        <div className="admin-notice">
          <h1>No database connected</h1>
          <p>
            Set <code>DATABASE_URL</code> to store submissions and list them here. Until then
            they&apos;re only emailed and/or sent to your CRM.
          </p>
        </div>
      </AdminShell>
    );
  }

  const [rows, total] = await Promise.all([listSubmissions(200), countSubmissions()]);

  return (
    <AdminShell>
      <header className="admin-top">
        <div>
          <span className="admin-eyebrow">{site.packageName} · Onboarding</span>
          <h1>Submissions</h1>
        </div>
        <div className="admin-actions">
          <a className="btn btn-ghost btn-sm" href="/api/admin/export">
            Export CSV
          </a>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <p className="admin-count">
        <strong>{total}</strong> total
        {rows.length < total ? ` · showing the latest ${rows.length}` : ""}
      </p>

      {rows.length === 0 ? (
        <div className="admin-notice">
          <h2>No submissions yet</h2>
          <p>Completed questionnaires will appear here as they come in.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Advisor</th>
                <th>Firm</th>
                <th>Contact</th>
                <th>Online today</th>
                <th>Timeline</th>
                <th>Services</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="nowrap mono-cell">{formatDate(row.created_at)}</td>
                  <td>
                    <Link className="admin-link" href={`/admin/${row.id}`}>
                      {`${row.first_name} ${row.last_name}`.trim() || "—"}
                    </Link>
                  </td>
                  <td>{row.firm_name || "—"}</td>
                  <td>
                    <span className="admin-stack">
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                      <a href={`tel:${row.phone}`}>{row.phone}</a>
                    </span>
                  </td>
                  <td>{row.current_site || "—"}</td>
                  <td className="nowrap">{row.timeline || "—"}</td>
                  <td>
                    <span className="admin-chip">{row.services.length}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
