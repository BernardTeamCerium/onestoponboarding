import { STEPS } from "./questionnaire";
import { site } from "./site";
import type { Answers, Submission } from "./validation";

/**
 * Emails each submission to the team via Resend. Optional: with no
 * RESEND_API_KEY the app just skips it.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TIMEOUT_MS = 12_000;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL_FROM);
}

function asText(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value == null ? "" : String(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Groups the answers by questionnaire step, skipping anything left blank. */
function sections(answers: Answers): Array<{ title: string; rows: Array<[string, string]> }> {
  return STEPS.map((step) => ({
    title: step.title,
    rows: step.fields
      .filter((field) => field.type !== "consent")
      .map((field) => [field.label, asText(answers[field.name])] as [string, string])
      .filter(([, value]) => value !== ""),
  })).filter((section) => section.rows.length > 0);
}

function buildHtml(answers: Answers, meta: Submission["meta"], adminUrl?: string): string {
  const name = `${asText(answers.firstName)} ${asText(answers.lastName)}`.trim();
  const blocks = sections(answers)
    .map(
      (section) => `
      <h2 style="font:600 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;text-transform:uppercase;letter-spacing:.08em;color:#8b94a1;margin:26px 0 8px">${escapeHtml(section.title)}</h2>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
        ${section.rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:7px 12px 7px 0;font:400 14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#5a6573;vertical-align:top;width:42%;border-bottom:1px solid #eceef1">${escapeHtml(label)}</td>
            <td style="padding:7px 0;font:600 14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#101828;vertical-align:top;border-bottom:1px solid #eceef1">${escapeHtml(value)}</td>
          </tr>`,
          )
          .join("")}
      </table>`,
    )
    .join("");

  const source = meta?.utmSource || meta?.pageUrl || meta?.referrer || "";

  return `<!doctype html><html><body style="margin:0;background:#f8f6f5;padding:28px">
    <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e9ebef;border-radius:14px;overflow:hidden">
      <div style="background:#080b12;padding:20px 26px">
        <div style="font:500 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:#f26522">${escapeHtml(site.packageName)} · Onboarding</div>
        <div style="font:700 20px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#fff;margin-top:6px">${escapeHtml(name || "New submission")}</div>
        <div style="font:400 14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:rgba(255,255,255,.6);margin-top:2px">${escapeHtml(asText(answers.firmName))}</div>
      </div>
      <div style="padding:6px 26px 28px">
        ${blocks}
        ${source ? `<p style="font:400 12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#8b94a1;margin-top:24px">Source: ${escapeHtml(source)}</p>` : ""}
        ${adminUrl ? `<p style="margin-top:24px"><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#f26522;color:#fff;font:600 14px/1 -apple-system,Segoe UI,Roboto,sans-serif;text-decoration:none;padding:12px 22px;border-radius:999px">Open in dashboard</a></p>` : ""}
      </div>
    </div>
  </body></html>`;
}

function buildText(answers: Answers): string {
  const lines: string[] = [`${site.packageName} — Onboarding Questionnaire`, ""];
  for (const section of sections(answers)) {
    lines.push(`--- ${section.title} ---`);
    for (const [label, value] of section.rows) lines.push(`${label}: ${value}`);
    lines.push("");
  }
  lines.push(`Email/SMS consent: ${answers.consent ? "Yes" : "No"}`);
  lines.push(`Submitted: ${new Date().toISOString()}`);
  return lines.join("\n");
}

/** Sends the notification. Throws so the caller can log a warning. */
export async function sendTeamNotification(
  answers: Answers,
  meta: Submission["meta"],
  submissionId?: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_EMAIL_FROM;
  if (!apiKey || !from) return;

  const to = (process.env.NOTIFY_EMAIL_TO ?? site.email)
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  const name = `${asText(answers.firstName)} ${asText(answers.lastName)}`.trim();
  const firm = asText(answers.firmName);
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const adminUrl = base && submissionId ? `${base}/admin/${submissionId}` : undefined;

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: asText(answers.email) || undefined,
      subject: `Onboarding: ${name || "New submission"}${firm ? ` — ${firm}` : ""}`,
      html: buildHtml(answers, meta, adminUrl),
      text: buildText(answers),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend rejected the notification (${response.status}): ${detail.slice(0, 300)}`);
  }
}
