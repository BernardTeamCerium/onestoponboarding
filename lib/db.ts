import postgres from "postgres";
import type { Answers, Submission } from "./validation";

/**
 * Submission storage. Any Postgres works — Neon, Supabase, Vercel Postgres —
 * so long as DATABASE_URL is set. Without it the app simply skips storage,
 * which keeps local development and demos running with no database at all.
 */

export interface SubmissionRow {
  id: string;
  created_at: Date;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  firm_name: string;
  current_site: string;
  timeline: string;
  services: string[];
  answers: Answers;
  meta: Record<string, string>;
  ghl_contact_id: string | null;
  ghl_delivered: boolean;
}

type Sql = ReturnType<typeof postgres>;

let client: Sql | null = null;
let schemaReady: Promise<void> | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function sql(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  if (!client) {
    const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    client = postgres(url, {
      // Managed Postgres requires TLS; a local instance usually has none.
      ssl: isLocal ? false : "require",
      // Poolers in transaction mode reject prepared statements.
      prepare: false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return client;
}

/** Creates the table on first use, once per process. */
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = sql();
      await db`
        create table if not exists submissions (
          id text primary key,
          created_at timestamptz not null default now(),
          first_name text not null default '',
          last_name text not null default '',
          email text not null default '',
          phone text not null default '',
          firm_name text not null default '',
          current_site text not null default '',
          timeline text not null default '',
          services text[] not null default '{}',
          answers jsonb not null,
          meta jsonb not null default '{}'::jsonb,
          ghl_contact_id text,
          ghl_delivered boolean not null default false
        )
      `;
      await db`
        create index if not exists submissions_created_at_idx
          on submissions (created_at desc)
      `;
    })().catch((error) => {
      // Let the next call retry rather than caching a failure forever.
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Stores one submission and returns its id. */
export async function saveSubmission(
  answers: Answers,
  meta: Submission["meta"],
): Promise<string> {
  await ensureSchema();
  const db = sql();
  const id = crypto.randomUUID();

  await db`
    insert into submissions ${db({
      id,
      first_name: text(answers.firstName),
      last_name: text(answers.lastName),
      email: text(answers.email),
      phone: text(answers.phone),
      firm_name: text(answers.firmName),
      current_site: text(answers.currentSite),
      timeline: text(answers.timeline),
      services: (answers.services as string[] | undefined) ?? [],
      answers: db.json(answers as never),
      meta: db.json((meta ?? {}) as never),
    })}
  `;

  return id;
}

/** Records that a stored submission also reached GoHighLevel. */
export async function markDeliveredToGhl(id: string, contactId?: string): Promise<void> {
  const db = sql();
  await db`
    update submissions
       set ghl_delivered = true,
           ghl_contact_id = ${contactId ?? null}
     where id = ${id}
  `;
}

export async function countSubmissions(): Promise<number> {
  await ensureSchema();
  const db = sql();
  const rows = await db<{ count: string }[]>`select count(*)::text as count from submissions`;
  return Number(rows[0]?.count ?? 0);
}

/** Newest first. */
export async function listSubmissions(limit = 200): Promise<SubmissionRow[]> {
  await ensureSchema();
  const db = sql();
  return db<SubmissionRow[]>`
    select * from submissions
     order by created_at desc
     limit ${limit}
  `;
}

export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db<SubmissionRow[]>`select * from submissions where id = ${id} limit 1`;
  return rows[0] ?? null;
}
