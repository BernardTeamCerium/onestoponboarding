/**
 * Company details and page copy in one place.
 *
 * Brand colours live in `app/globals.css` as CSS custom properties — change the
 * six values under `:root` to re-skin the whole page.
 */
export const site = {
  company: "One Stop Print & Digital Solutions",
  shortName: "One Stop",
  tagline: "Your #1 Marketing Partner for Growth",
  phone: "(305) 495-9490",
  phoneHref: "tel:+13054959490",
  email: "Info@onestopprintco.com",
  address: "25 SE 2nd Ave, Ste 550, Miami, FL 33131",
  website: "https://onestopprintco.com",
  /** Optional GoHighLevel / Calendly booking link shown on the thank-you screen. */
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL ?? "",
  /** Roughly how long the questionnaire takes, shown up front. */
  estimatedMinutes: 2,
} as const;

export interface NextStep {
  when: string;
  title: string;
  description: string;
}

/**
 * The "what happens after you hit submit" promise. Shown before the form so
 * advisors know what they're signing up for, and again on the thank-you screen.
 */
export const NEXT_STEPS: NextStep[] = [
  {
    when: "Within minutes",
    title: "Confirmation lands in your inbox",
    description:
      "You'll get an email and a text confirming we have your answers, with a copy of what you told us for your records.",
  },
  {
    when: "1 business day",
    title: "We reach out to book your discovery call",
    description:
      "A 20-minute call with a strategist who works with advisors — we go through your goals, your niche and any compliance requirements.",
  },
  {
    when: "3–5 business days",
    title: "Your custom marketing blueprint",
    description:
      "A written plan covering brand, print, digital and follow-up — with scope, timeline and pricing laid out. No obligation.",
  },
  {
    when: "On your approval",
    title: "Kickoff and production",
    description:
      "Design, revisions and your compliance review, then everything goes to print and launch. One team, one point of contact.",
  },
];

/** Short trust points used in the hero. */
export const HERO_POINTS: string[] = [
  "Built specifically for financial advisors",
  "Compliance-ready files for your BD or RIA review",
  "Branding, print, web and CRM under one roof",
];
