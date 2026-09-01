import { NextResponse } from "next/server";
import { submissionSchema, fieldErrors } from "@/lib/validation";
import { deliverSubmission, isConfigured } from "@/lib/gohighlevel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

/**
 * Per-instance throttle. Good enough to blunt casual abuse of a single form;
 * put a WAF or Cloudflare Turnstile in front if this page ever gets targeted.
 */
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Drop addresses whose window has expired so the map can't grow without bound.
  if (hits.size > 1000) {
    for (const [key, times] of hits) {
      if (times.every((time) => now - time >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > RATE_LIMIT_MAX;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Some answers need another look.",
        errors: fieldErrors(parsed.error),
      },
      { status: 422 },
    );
  }

  // Honeypot: pretend everything went fine so bots don't learn anything.
  if (parsed.data.company_website.trim() !== "") {
    return NextResponse.json({ ok: true, delivered: false });
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { ok: false, message: "Too many submissions from this connection. Please try again shortly." },
      { status: 429 },
    );
  }

  const { answers, meta } = parsed.data;

  if (!isConfigured()) {
    // Dry-run mode: nothing is configured yet, so log the lead rather than lose it.
    console.warn(
      "[onboarding] GoHighLevel is not configured — logging submission instead of sending it.\n" +
        JSON.stringify(answers, null, 2),
    );
    return NextResponse.json({ ok: true, delivered: false });
  }

  try {
    const result = await deliverSubmission(answers, meta);
    for (const warning of result.warnings) {
      console.warn(`[onboarding] non-fatal GoHighLevel issue: ${warning}`);
    }
    return NextResponse.json({ ok: true, delivered: result.delivered });
  } catch (error) {
    // Log the full submission so a failed hand-off never means a lost lead.
    console.error("[onboarding] delivery to GoHighLevel failed:", error);
    console.error("[onboarding] submission was:", JSON.stringify(answers));
    return NextResponse.json(
      {
        ok: false,
        message:
          "We couldn't submit your answers just now. Please try again, or call us at (305) 495-9490 and we'll take it down for you.",
      },
      { status: 502 },
    );
  }
}
