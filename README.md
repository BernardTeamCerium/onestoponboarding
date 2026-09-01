# Advisor Onboarding — One Stop Print & Digital Solutions

A landing page and onboarding questionnaire for financial advisors. It captures
personal and professional background, the services they're interested in and
their goals, tells them exactly what happens next, and hands the whole
submission to GoHighLevel so email and SMS follow-up fire automatically.

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

1. **Hero** — the promise, the time cost (about 2 minutes), and a side card
   listing what happens after they submit, so nothing is a surprise.
2. **Your roadmap** — the four next steps in detail.
3. **The questionnaire** — four short steps with a progress bar:
   - *About you* — name, email, mobile, city/state, website.
   - *Your practice* — firm, role, years in the industry, team size,
     broker-dealer/RIA affiliation, ideal client.
   - *What you're interested in* — services, how marketing is handled today,
     package interest.
   - *Your goals* — primary goal, target new clients, timeline, budget,
     preferred contact method, biggest obstacle, and email/SMS consent.
4. **Thank-you screen** — repeats the four next steps with timing, plus a
   booking button when `NEXT_PUBLIC_BOOKING_URL` is set.

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
`yearsExperience`, `teamSize`, `affiliation`, `ideal_client_list`,
`services_list`, `currentMarketing`, `packageInterest`, `primaryGoal`,
`clientGoal`, `timeline`, `budget`, `preferredContact`, `challenge`,
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
| `goal-*` | e.g. `goal-bring-in-more-qualified-leads` |
| `package-*` | e.g. `package-professional-growth-package` |
| `prefers-*` | e.g. `prefers-text-message` — branch email vs. SMS on this |
| `service-*` | One per selected service, e.g. `service-website-design-and-development` |

A good starting set of workflows:

1. **Instant confirmation** — trigger on tag `advisor-onboarding`; send the
   confirmation email and text promised on the thank-you screen.
2. **Internal alert** — same trigger; notify the advisor team with the note
   attached to the contact.
3. **Booking nudge** — wait 1 day, then if no appointment is booked, send a
   reminder with the calendar link.
4. **Hot-lead routing** — trigger on `timeline-right-away` and assign the
   contact to a strategist immediately.

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
| Brand colours | The six variables under `:root` in `app/globals.css` |
| Company details, phone, address, booking link | `lib/site.ts` |
| The "what happens next" steps | `NEXT_STEPS` in `lib/site.ts` |
| Questions, options, required fields | `lib/questionnaire.ts` |
| Headline and section copy | `app/page.tsx` |

`lib/questionnaire.ts` is the single source of truth: adding a question there
adds it to the form, the validation, the note and the webhook payload
automatically. Give new fields a `name` you're happy to see in GoHighLevel.

> **Note on colours:** `onestopprintco.com` couldn't be reached from the build
> environment to sample its exact palette, so the navy/orange/cream scheme here
> is a considered stand-in. Drop the real hex values into the `:root` block in
> `app/globals.css` and the whole page follows.

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
  layout.tsx              fonts, metadata
  page.tsx                hero, roadmap, footer
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
