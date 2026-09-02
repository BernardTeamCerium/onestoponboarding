# Digital Presence Package — Onboarding

The onboarding questionnaire for advisors starting on the Digital Presence
Package. The package starts with the advisor's website, so the questionnaire
does too: where they stand online today, their domain, what the site needs to
do, and which assets they already have. It then covers the services that
surround the site, tells them exactly what happens next, and hands the whole
submission to GoHighLevel so email and SMS follow-up fire automatically.

The page is the form: a dark technical header, the questionnaire on light
surfaces, and a footer. There is no sales pitch — these advisors have already
signed.

Built with Next.js (App Router) and TypeScript. No database — GoHighLevel is
the system of record.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your GoHighLevel values
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

Deploying to Vercel: import the repo, add the environment variables from
`.env.example` under **Settings → Environment Variables**, and deploy. No other
configuration is needed.

> **Dry-run mode:** with no GoHighLevel variables set, the form works end to end
> and the submission is logged to the server console instead of being sent.
> Useful for demos — but set the variables before you send real traffic here.

## What the advisor sees

1. **Header** — "Let's get you online", the time cost, and a slim strip of the
   four next steps so nothing after submitting is a surprise.
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

## GoHighLevel setup

The server route `POST /api/onboarding` never runs in the browser, so your token
stays private. It delivers a submission by up to three routes:

| Route | What it does | Needs |
| --- | --- | --- |
| Contact upsert | Creates/updates the contact with name, email, phone (E.164), firm, city/state, source and tags | `GHL_API_TOKEN`, `GHL_LOCATION_ID` |
| Contact note | Attaches the full questionnaire transcript to the contact | same as above |
| Inbound webhook | Posts every answer as workflow variables | `GHL_INBOUND_WEBHOOK_URL` |

The contact upsert is the critical path; if the note or webhook fails, the lead
is still captured and the problem is logged as a warning.

### 1. Create a Private Integration token

**Settings → Private Integrations → Create**, with scopes
`contacts.readonly`, `contacts.write` and `objects/record.write` (for notes).
Copy the token into `GHL_API_TOKEN`.

### 2. Find your Location ID

**Settings → Business Profile → Location ID** (sometimes called Sub-Account ID).
Copy it into `GHL_LOCATION_ID`.

### 3. Add the inbound webhook (recommended)

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

### 4. Build the messaging workflows

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

### 5. Custom fields (optional)

The full transcript always lands as a note on the contact, so this step is
optional. To also file specific answers into GoHighLevel custom fields, create
the fields, then map questionnaire field names to their IDs:

```
GHL_CUSTOM_FIELDS={"firmName":"AbC123","services":"DeF456","primaryGoal":"GhI789"}
```

Any questionnaire field name works as a key — see `lib/questionnaire.ts`.

## Customising

| What | Where |
| --- | --- |
| Brand colours | The tokens under `:root` in `app/globals.css` — `--orange`, `--black`, `--white`, `--page` |
| Company details, phone, address, booking link | `lib/site.ts` |
| The "what happens next" steps | `NEXT_STEPS` in `lib/site.ts` |
| Questions, options, required fields | `lib/questionnaire.ts` |
| Welcome headline and intro copy | `app/page.tsx` |

`lib/questionnaire.ts` is the single source of truth: adding a question there
adds it to the form, the validation, the note and the webhook payload
automatically. Give new fields a `name` you're happy to see in GoHighLevel.

The look is set by the tokens at the top of `app/globals.css`: monospace
micro-labels (`--font-mono`), hairline borders, small radii, and a faint grid
with an orange glow behind the header.

> **Note on colours:** the palette is orange, white and black — a dark
> technical header and footer with the form on light surfaces. The exact orange
> is `--orange: #ff6b00`; adjust it and the accents follow. `onestopprintco.com`
> couldn't be reached from the build environment, so if the site's orange has a
> specific value, set it there.

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
  layout.tsx              fonts (Inter + JetBrains Mono), metadata
  page.tsx                header, intro, next-steps strip, footer
  globals.css             brand tokens and all styling
  api/onboarding/route.ts validation, honeypot, rate limit, delivery
components/
  OnboardingForm.tsx      multi-step form and thank-you screen
lib/
  questionnaire.ts        the questions (single source of truth)
  validation.ts           zod schema shared by client and server
  gohighlevel.ts          contact upsert, note, webhook, tag building
  site.ts                 company details and next-steps copy
```
