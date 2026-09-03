/**
 * Company details and page copy in one place.
 *
 * Brand colours live in `app/globals.css` as CSS custom properties — change the
 * six values under `:root` to re-skin the whole page.
 */
export const site = {
  company: "One Stop Print & Digital Marketing Solutions",
  shortName: "OneStop",

  /** The two-line lockup under the wordmark, as it appears in the logo. */
  logoSubLines: ["Print & Digital", "Marketing Solutions"] as const,
  tagline: "The advisor growth platform — built exclusively for financial professionals.",
  phone: "(305) 495-9490",
  phoneHref: "tel:+13054959490",
  email: "Info@onestopprintco.com",
  address: "25 SE 2nd Ave, Ste 550, Miami, FL 33131",
  website: "https://onestopprintco.com",
  /** The package this questionnaire onboards advisors onto. */
  packageName: "Digital Presence Package",

  /** Optional GoHighLevel / Calendly booking link shown on the thank-you screen. */
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL ?? "",
  /** Roughly how long the questionnaire takes, shown up front. */
  estimatedMinutes: 4,
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
    when: "Done",
    title: "We have your answers",
    description:
      "Your responses are in and with your build team. Nothing else is needed from you right now.",
  },
  {
    when: "1 business day",
    title: "Your build team reaches out",
    description:
      "We book your kickoff call and send a short checklist — domain access, logo files, headshot and bio — so nothing stalls the build.",
  },
  {
    when: "3–5 business days",
    title: "Your site map and build plan",
    description:
      "The pages we'll build, in what order, with dates — plus anything that needs to go through your broker-dealer or RIA first.",
  },
  {
    when: "On your approval",
    title: "We build, review and launch",
    description:
      "Design, revisions and your compliance review. Your site goes live, then the rest of your package connects to it.",
  },
];
