# Digital Presence Package — Onboarding

The onboarding questionnaire for advisors starting on the Digital Presence
Package. The package starts with the advisor's website, so the questionnaire
does too: where they stand online today, their domain, what the site needs to
do, and which assets they already have. It then covers the services that
surround the site and tells them exactly what happens next.

**It runs standalone.** Submissions are stored in your own Postgres database
and listed in a password-protected dashboard at `/admin`, with CSV export, and
optionally emailed to your team as they arrive. GoHighLevel is supported but
entirely optional — set two environment variables whenever you want it, with
no code change.

**It shares its database with the One Stop platform.** The platform reads a
stable `onboarding_submissions_v1` view, and submissions carry an
`external_ref` from the `?ref=` link so they attach to the right record. See
[Integrating with the One Stop platform](#integrating-with-the-one-stop-platform).

The page follows onestopprintco.com's composition: the two-segment black
utility bar, the OneStop wordmark on white with an orange CTA pill, and a
left-aligned hero whose headline ends in an orange word, set beside a dark
technical panel — the brand's stat-panel treatment, here listing the
onboarding sequence. The questionnaire sits below on light surfaces. There is
no sales pitch — these advisors have already signed.

Built with Next.js (App Router) and TypeScript. No database — GoHighLevel is
the system of record.

## Quick start

```bash
npm install
cp .env.example .env.local   # set DATABASE_URL and ADMIN_PASSWORD at minimum
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

Deploying to Vercel: import the repo, add the environment variables from
`.env.example` under **Settings → Environment Variables**, and deploy. No other
configuration is needed.

> **Dry-run mode:** with no destination configured at all, the form still works
> end to end and the submission is logged to the server console. Useful for
> demos — but set `DATABASE_URL` before you send real traffic here, or answers
> will only exist in your logs.

## What the advisor sees

1. **Hero** — "Let's Get You Online." beside a dark panel listing the four
   next steps with timings, so nothing after submitting is a surprise.
2. **The questionnaire** — five short steps with a progress bar:
   - *About you* — name, email, mobile, city/state, designations as they should
     appear on the site.
   - *Your practice* — firm, role, years in the industry, team size,
     broker-dealer/RIA affiliation, who they serve.
   - *Your website* — where they are online today, current address, the domain
     they own or want, domain status, what the site should do first, and which
     assets (logo, headshot, bio, testimonials, approved copy) they already have.
   - *Your package* — which surrounding services to switch on, and what to set
     up first after the site.
   - *Getting started* — what matters most about being online, target launch
     date, whether compliance review is required, preferred contact method,
     notes, and email/SMS consent.
3. **Thank-you screen** — the four next steps in full with timing, plus a
   booking button when `NEXT_PUBLIC_BOOKING_URL` is set.

The services offered on step four are Google My Business Profile Setup &
Management, Search Engine Optimization, Google Knowledge Panel, Newsletter
Marketing Services, Review Management System, Printing Services, Lead
Generation and Appointment Booking. Edit `PACKAGE_SERVICES` in
`lib/questionnaire.ts`.

Answers are validated in the browser *and* again on the server, so a step can't
be skipped and the API can't be posted to with junk.

## Where submissions go

`POST /api/onboarding` runs server-side only, so credentials never reach the
browser. It fans each submission out to every configured destination:

| Destination | What it does | Needs |
| --- | --- | --- |
| Database | Stores the full submission; powers `/admin` and CSV export | `DATABASE_URL` |
| Team email | Emails the formatted answers to your inbox | `RESEND_API_KEY`, `NOTIFY_EMAIL_FROM` |
| GoHighLevel | Upserts the contact, attaches the transcript as a note, posts to a workflow webhook | `GHL_API_TOKEN`, `GHL_LOCATION_ID` |

Each is independent and best-effort: one failing never blocks the others, and
the submission counts as captured if **any** succeeded. If they all fail, the
advisor sees an error and the full answers are written to the server log so
nothing is lost.

## The dashboard

Set `ADMIN_PASSWORD` and visit `/admin`:

- Every submission, newest first — advisor, firm, contact details, where they
  are online today, target timeline and how many services they picked.
- Click any row for the full transcript, grouped by questionnaire step, with
  one-click email and call buttons.
- **Export CSV** gives you every submission with a column per question.

Sign-in sets an httpOnly cookie signed with `ADMIN_PASSWORD`, valid for seven
days; changing the password signs everyone out. Login attempts are throttled.
The page is `noindex` and never rendered statically.

## Database

Any Postgres works — [Neon](https://neon.tech), [Supabase](https://supabase.com)
and Vercel Postgres all have free tiers well above this volume. Copy the
connection string into `DATABASE_URL`; the table is created automatically on
first submission, so there is no migration step.

## GoHighLevel (optional)

Skip this section entirely if you're running standalone. To turn it on later,
set the variables below and redeploy — submissions then go to your CRM *in
addition to* the database and email.

### Create a Private Integration token

**Settings → Private Integrations → Create**, with scopes
`contacts.readonly`, `contacts.write` and `objects/record.write` (for notes).
Copy the token into `GHL_API_TOKEN`.

### Find your Location ID

**Settings → Business Profile → Location ID** (sometimes called Sub-Account ID).
Copy it into `GHL_LOCATION_ID`.

### Add the inbound webhook (recommended)

**Automation → Workflows → Create → trigger "Inbound Webhook"**. Copy the
webhook URL into `GHL_INBOUND_WEBHOOK_URL`. Submit the form once so
GoHighLevel can capture the payload shape, then map the fields into your email
and SMS templates. Useful variables:

`firstName`, `lastName`, `full_name`, `email`, `phone`, `firmName`, `role`,
`yearsExperience`, `teamSize`, `affiliation`, `designations`,
`ideal_client_list`, `currentSite`, `currentSiteUrl`, `domainIdea`,
`domainStatus`, `sitePriority`, `assets`, `services_list`, `servicePriority`,
`primaryGoal`, `timeline`, `complianceReview`, `preferredContact`, `notes`,
`contactId`, `submittedAt`, `utmSource`, `utmCampaign`.

### Build the messaging workflows

Every submission is tagged, so workflows can trigger on **Contact Tag** instead
of parsing anything:

| Tag | Meaning |
| --- | --- |
| `advisor-onboarding` | Every submission — use this for the instant confirmation email + SMS |
| `financial-advisor` | Audience tag |
| `role-*` | e.g. `role-ria-owner-principal` |
| `timeline-*` | e.g. `timeline-right-away` — good for prioritising outreach |
| `goal-*` | e.g. `goal-getting-online-for-the-first-time` |
| `site-*` | Where they stand online today, e.g. `site-im-not-online-yet` — routes the build track |
| `prefers-*` | e.g. `prefers-text-message` — branch email vs. SMS on this |
| `service-*` | One per selected service, e.g. `service-search-engine-optimization` |

A good starting set of workflows:

1. **Instant confirmation** — trigger on tag `advisor-onboarding`; send the
   confirmation email and text promised on the thank-you screen.
2. **Internal alert** — same trigger; notify the advisor team with the note
   attached to the contact.
3. **Kickoff nudge** — wait 1 day, then if no kickoff call is booked, send a
   reminder with the calendar link.
4. **Priority routing** — trigger on `timeline-as-soon-as-possible` or
   `site-im-not-online-yet` and assign the contact to a build team immediately.

Branch on `prefers-text-message` / `prefers-email` / `prefers-phone-call` to
respect the contact method the advisor chose.

### Custom fields (optional)

The full transcript always lands as a note on the contact, so this step is
optional. To also file specific answers into GoHighLevel custom fields, create
the fields, then map questionnaire field names to their IDs:

```
GHL_CUSTOM_FIELDS={"firmName":"AbC123","services":"DeF456","primaryGoal":"GhI789"}
```

Any questionnaire field name works as a key — see `lib/questionnaire.ts`.

## Integrating with the One Stop platform

The platform shares this database and reads submissions directly. Two things
make that safe to rely on.

### Read the view, not the table

```sql
select * from onboarding_submissions_v1 order by created_at desc;
```

`onboarding_submissions_v1` is the contract. It flattens the questionnaire into
typed columns so the platform never parses JSON, and it is **versioned**: this
app may add questions, rename fields or reshape the underlying table freely,
but it will not change this view's existing columns. A breaking change ships as
`onboarding_submissions_v2` alongside, giving you time to migrate.

Querying the `submissions` table directly works, but its shape follows the
questionnaire and will change without warning.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | UUID, stable |
| `created_at` | timestamptz | |
| `external_ref` | text | Your platform's identifier — see below. Null when the advisor arrived without one |
| `first_name`, `last_name`, `email`, `phone` | text | Phone as typed; E.164 only goes to the CRM |
| `city_state`, `designations` | text | |
| `firm_name`, `role`, `years_experience`, `team_size`, `affiliation` | text | |
| `ideal_client` | text[] | |
| `current_site`, `current_site_url`, `domain_idea`, `domain_status`, `site_priority` | text | |
| `assets_ready` | text[] | Logo, headshot, bio and so on |
| `services` | text[] | Selected package services |
| `service_priority`, `primary_goal`, `timeline`, `compliance_review`, `preferred_contact` | text | |
| `notes` | text | Free text |
| `consent` | boolean | Express email/SMS consent |
| `raw_answers`, `raw_meta` | jsonb | Everything, including any question added after this view |
| `ghl_delivered`, `ghl_contact_id` | boolean, text | Whether it also reached GoHighLevel |

Text columns carry the answer labels exactly as the advisor saw them (for
example `"I'm not online yet"`), so match on the full string rather than a
prefix.

### Linking a submission to a platform record

Send advisors a link carrying their identifier:

```
https://onboarding.onestopprintco.com/?ref=ADVISOR_ID
```

The form captures `ref` (or `external_ref`) from the query string, carries it
through every step, and stores it in `external_ref`. It also reaches the
GoHighLevel webhook as `externalRef`, and appears in the dashboard and CSV
export. Anything URL-safe up to 200 characters works — an account id, a UUID, a
signed token your platform decodes.

An advisor who lands without a `ref` still submits normally; `external_ref` is
just null, and you match on email instead.

### A read-only role for the platform

Give the platform its own credentials rather than reusing this app's:

```sql
create role onestop_platform login password 'choose-a-strong-one';
grant connect on database your_db to onestop_platform;
grant usage on schema public to onestop_platform;
grant select on onboarding_submissions_v1 to onestop_platform;
```

That grants the view only — no write access, and no access to the underlying
table. This app creates its table, index and view automatically on first
submission, so it needs a role that can run DDL; the platform does not.

### Schema changes

The app runs `create table if not exists`, `add column if not exists` and
`create or replace view` on startup, so deploys are idempotent and there is no
migration step. If the view can't be created — usually a permissions problem —
it logs a warning and carries on storing submissions; it never fails a
submission over the view.

## Customising

| What | Where |
| --- | --- |
| Brand colours | The tokens under `:root` in `app/globals.css` — `--orange`, the gradient pair, `--black`, `--ink`, `--page` |
| Company name, wordmark lockup, phone, address, booking link | `lib/site.ts` |
| The "what happens next" steps | `NEXT_STEPS` in `lib/site.ts` |
| Questions, options, required fields | `lib/questionnaire.ts` |
| Welcome headline and intro copy | `app/page.tsx` |

`lib/questionnaire.ts` is the single source of truth: adding a question there
adds it to the form, the validation, the note and the webhook payload
automatically. Give new fields a `name` you're happy to see in GoHighLevel.

The look is set by the tokens at the top of `app/globals.css`: monospace
micro-labels (`--font-mono`), hairline borders, pill buttons, and a faint grid
behind the hero. The wordmark is drawn in `app/page.tsx` as type plus a small
inline SVG mark, so there is no logo file to manage — swap in the real asset
there if you'd rather use it.

> **Note on colours:** the palette is sampled from the live site — orange
> (`--orange: #f26522`, gradient `#f97b2c` → `#ec4a1c`) on white, with a black
> utility bar and footer (`--black: #080b12`) and ink `#101828`. The form card
> keeps a black header band so the questionnaire itself still reads as a
> distinct panel. Adjust the tokens and everything follows.

## Compliance and anti-spam

- **Express written consent** for email and SMS is a required checkbox on the
  last step, with the standard rates/opt-out disclosure, and the answer is
  recorded in the contact note. Don't make it optional — TCPA.
- A hidden honeypot field silently discards bot submissions.
- The API route rate-limits to 5 submissions per IP per 10 minutes, per server
  instance. Put Cloudflare Turnstile or a WAF in front if the page is ever
  targeted in volume.
- The page is marked `noindex` — it's meant to be linked from campaigns, not
  found in search. Remove `robots` in `app/layout.tsx` to change that.

## Project layout

```
app/
  layout.tsx              fonts (Plus Jakarta Sans + JetBrains Mono), metadata
  page.tsx                utility bar, wordmark header, hero, panel, footer
  globals.css             brand tokens and all styling
  api/onboarding/route.ts validation, honeypot, rate limit, delivery
  api/admin/*             login, logout, CSV export
  admin/page.tsx          submissions dashboard
  admin/[id]/page.tsx     one submission in full
components/
  OnboardingForm.tsx      multi-step form and thank-you screen
  AdminLogin.tsx          dashboard sign-in
lib/
  questionnaire.ts        the questions (single source of truth)
  validation.ts           zod schema shared by client and server
  delivery.ts             fans a submission out to every destination
  db.ts                   Postgres storage and queries
  notify.ts               team notification email
  adminAuth.ts            signed dashboard session
  gohighlevel.ts          contact upsert, note, webhook, tag building
  site.ts                 company details and next-steps copy
```
