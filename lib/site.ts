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
  estimatedMinutes: 3,
} as const;

export interface NextStep {
  when: string;
  title: string;
  description: string;
}

/**
 * The "what happens after you hit submit" promise. Shown in the header so the
 * advisor knows what they're in for, and again in full on the thank-you screen.
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
    title: "Your account manager reaches out",
    description:
      "We'll book your kickoff call and send a short list of what we need from you — brand assets, logins and any compliance contacts.",
  },
  {
    when: "3–5 business days",
    title: "Your onboarding plan",
    description:
      "A written plan covering what we're building, in what order, with dates — including anything that needs your broker-dealer or RIA review.",
  },
  {
    when: "On your approval",
    title: "Production starts",
    description:
      "Design, revisions and your compliance review, then everything goes to print and launch. One team, one point of contact.",
  },
];
