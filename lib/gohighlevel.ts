import { STEPS, FIELD_BY_NAME } from "./questionnaire";
import type { Answers, Submission } from "./validation";

const API_BASE = process.env.GHL_API_BASE ?? "https://services.leadconnectorhq.com";
const API_VERSION = process.env.GHL_API_VERSION ?? "2021-07-28";
const TIMEOUT_MS = 12_000;

export interface DeliveryResult {
  /** True when the submission reached GoHighLevel by at least one route. */
  delivered: boolean;
  contactId?: string;
  /** Non-fatal problems worth logging (the lead was still captured). */
  warnings: string[];
}

export function isApiConfigured(): boolean {
  return Boolean(process.env.GHL_API_TOKEN && process.env.GHL_LOCATION_ID);
}

export function isWebhookConfigured(): boolean {
  return Boolean(process.env.GHL_INBOUND_WEBHOOK_URL);
}

export function isConfigured(): boolean {
  return isApiConfigured() || isWebhookConfigured();
}

/** "Right away" -> "right-away", for use in tag names. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Best-effort E.164 for US numbers; anything else is passed through cleaned up. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

function asText(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value == null ? "" : String(value);
}

/**
 * Tags are how the questionnaire drives GoHighLevel: build workflows that
 * trigger on `advisor-onboarding` for the confirmation email/SMS, and on the
 * `service-*` / `timeline-*` tags for follow-up segmentation.
 */
export function buildTags(answers: Answers): string[] {
  const tags = new Set<string>(["advisor-onboarding", "financial-advisor"]);

  const role = asText(answers.role);
  if (role) tags.add(`role-${slugify(role)}`);

  const timeline = asText(answers.timeline);
  if (timeline) tags.add(`timeline-${slugify(timeline)}`);

  const goal = asText(answers.primaryGoal);
  if (goal) tags.add(`goal-${slugify(goal)}`);

  const contact = asText(answers.preferredContact);
  if (contact) tags.add(`prefers-${slugify(contact)}`);

  for (const service of (answers.services as string[] | undefined) ?? []) {
    tags.add(`service-${slugify(service)}`);
  }

  for (const extra of (process.env.GHL_EXTRA_TAGS ?? "").split(",")) {
    const tag = extra.trim();
    if (tag) tags.add(tag);
  }

  return [...tags];
}

/** A readable transcript of every answer, attached to the contact as a note. */
export function buildNote(answers: Answers, meta: Submission["meta"]): string {
  const lines: string[] = ["Advisor Onboarding Questionnaire", ""];

  for (const step of STEPS) {
    const rows = step.fields
      .filter((field) => field.type !== "consent")
      .map((field) => [field.label, asText(answers[field.name])] as const)
      .filter(([, value]) => value !== "");

    if (rows.length === 0) continue;

    lines.push(`--- ${step.title} ---`);
    for (const [label, value] of rows) lines.push(`${label}: ${value}`);
    lines.push("");
  }

  lines.push(`Email/SMS consent: ${answers.consent ? "Yes" : "No"}`);
  lines.push(`Submitted: ${new Date().toISOString()}`);

  const source = meta?.utmSource || meta?.pageUrl || meta?.referrer;
  if (source) lines.push(`Source: ${source}`);

  return lines.join("\n");
}

/**
 * Optional mapping of questionnaire field names to GoHighLevel custom field
 * IDs, supplied as JSON in GHL_CUSTOM_FIELDS, e.g.
 * {"firmName":"AbC123...","services":"DeF456..."}
 */
function customFieldMap(): Record<string, string> {
  const raw = process.env.GHL_CUSTOM_FIELDS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
      );
    }
    console.warn("[ghl] GHL_CUSTOM_FIELDS must be a JSON object; ignoring it.");
  } catch {
    console.warn("[ghl] GHL_CUSTOM_FIELDS is not valid JSON; ignoring it.");
  }
  return {};
}

function buildCustomFields(answers: Answers): Array<{ id: string; field_value: string }> {
  return Object.entries(customFieldMap())
    .filter(([name]) => name in FIELD_BY_NAME)
    .map(([name, id]) => ({ id, field_value: asText(answers[name]) }))
    .filter((entry) => entry.field_value !== "");
}

async function ghlFetch(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GHL_API_TOKEN}`,
      Version: API_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/** Creates or updates the contact and returns its id. */
async function upsertContact(answers: Answers, meta: Submission["meta"]): Promise<string> {
  const [city = "", state = ""] = asText(answers.cityState)
    .split(",")
    .map((part) => part.trim());

  const payload: Record<string, unknown> = {
    locationId: process.env.GHL_LOCATION_ID,
    firstName: asText(answers.firstName),
    lastName: asText(answers.lastName),
    name: `${asText(answers.firstName)} ${asText(answers.lastName)}`.trim(),
    email: asText(answers.email),
    phone: normalizePhone(asText(answers.phone)),
    companyName: asText(answers.firmName),
    website: asText(answers.website),
    city,
    state,
    source: process.env.GHL_SOURCE ?? "Advisor Onboarding Page",
    tags: buildTags(answers),
  };

  const customFields = buildCustomFields(answers);
  if (customFields.length > 0) payload.customFields = customFields;

  if (meta?.utmSource) payload.attributionSource = { utmSource: meta.utmSource, utmMedium: meta.utmMedium };

  const response = await ghlFetch("/contacts/upsert", payload);

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GoHighLevel contact upsert failed (${response.status}): ${detail.slice(0, 500)}`);
  }

  const data = (await response.json()) as { contact?: { id?: string }; id?: string };
  const contactId = data.contact?.id ?? data.id;
  if (!contactId) throw new Error("GoHighLevel upsert succeeded but returned no contact id.");
  return contactId;
}

async function addNote(contactId: string, note: string): Promise<void> {
  const response = await ghlFetch(`/contacts/${contactId}/notes`, { body: note });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Note create failed (${response.status}): ${detail.slice(0, 300)}`);
  }
}

/**
 * Posts the whole submission to a GoHighLevel inbound webhook, so a workflow
 * can use every answer as a variable in emails and texts.
 */
async function postWebhook(answers: Answers, meta: Submission["meta"], contactId?: string): Promise<void> {
  const url = process.env.GHL_INBOUND_WEBHOOK_URL;
  if (!url) return;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...answers,
      phone: normalizePhone(asText(answers.phone)),
      full_name: `${asText(answers.firstName)} ${asText(answers.lastName)}`.trim(),
      services_list: asText(answers.services),
      ideal_client_list: asText(answers.idealClient),
      tags: buildTags(answers),
      contactId,
      submittedAt: new Date().toISOString(),
      ...meta,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Inbound webhook failed (${response.status}).`);
  }
}

/**
 * Sends a submission to GoHighLevel. The contact upsert is the critical path;
 * the note and the webhook are best-effort so a lead is never lost over them.
 */
export async function deliverSubmission(
  answers: Answers,
  meta: Submission["meta"],
): Promise<DeliveryResult> {
  const warnings: string[] = [];
  let contactId: string | undefined;
  let delivered = false;

  if (isApiConfigured()) {
    contactId = await upsertContact(answers, meta);
    delivered = true;

    try {
      await addNote(contactId, buildNote(answers, meta));
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (isWebhookConfigured()) {
    try {
      await postWebhook(answers, meta, contactId);
      delivered = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // With no API configured the webhook was the only route — that's fatal.
      if (!isApiConfigured()) throw new Error(message);
      warnings.push(message);
    }
  }

  return { delivered, contactId, warnings };
}
