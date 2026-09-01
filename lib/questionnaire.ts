/**
 * Single source of truth for the onboarding questionnaire.
 *
 * The form UI, the validation schema and the GoHighLevel payload are all
 * derived from this file, so adding or renaming a question only happens here.
 */

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "textarea"
  | "select"
  | "radio"
  | "multiselect"
  | "consent";

export interface Field {
  /** Key used in the payload and as the GoHighLevel custom-field lookup name. */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  /** Short helper text rendered under the field. */
  hint?: string;
  options?: string[];
  /** Renders the field at half width on wide screens. */
  half?: boolean;
  /** Maximum characters accepted (applies to free-text fields). */
  maxLength?: number;
}

export interface Step {
  id: string;
  title: string;
  /** One line telling the advisor why we ask, shown under the step title. */
  blurb: string;
  fields: Field[];
}

export const STEPS: Step[] = [
  {
    id: "personal",
    title: "About you",
    blurb: "The basics, so your account team knows who to reach and how.",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true, half: true, maxLength: 60, placeholder: "Jordan" },
      { name: "lastName", label: "Last name", type: "text", required: true, half: true, maxLength: 60, placeholder: "Rivera" },
      { name: "email", label: "Work email", type: "email", required: true, half: true, maxLength: 160, placeholder: "you@yourfirm.com" },
      { name: "phone", label: "Mobile phone", type: "tel", required: true, half: true, maxLength: 32, placeholder: "(305) 555-0142" },
      { name: "cityState", label: "City & state", type: "text", half: true, maxLength: 80, placeholder: "Miami, FL" },
      { name: "website", label: "Website", type: "url", half: true, maxLength: 200, placeholder: "yourfirm.com", hint: "Optional — leave blank if you don't have one yet." },
    ],
  },
  {
    id: "professional",
    title: "Your practice",
    blurb: "Your background shapes the messaging, the collateral and the compliance path.",
    fields: [
      { name: "firmName", label: "Firm or practice name", type: "text", required: true, maxLength: 120, placeholder: "Rivera Wealth Partners" },
      {
        name: "role",
        label: "Your role",
        type: "select",
        required: true,
        half: true,
        options: [
          "Financial Advisor",
          "Wealth Manager",
          "RIA Owner / Principal",
          "Insurance Agent",
          "Retirement Planner",
          "Team Lead / Partner",
          "Other",
        ],
      },
      {
        name: "yearsExperience",
        label: "Years in the industry",
        type: "select",
        required: true,
        half: true,
        options: ["Less than 2 years", "2–5 years", "6–10 years", "11–20 years", "20+ years"],
      },
      {
        name: "teamSize",
        label: "Team size",
        type: "select",
        half: true,
        options: ["Just me", "2–5 people", "6–15 people", "16+ people"],
      },
      {
        name: "affiliation",
        label: "Broker-dealer / RIA affiliation",
        type: "text",
        half: true,
        maxLength: 120,
        placeholder: "e.g. LPL, Independent RIA",
        hint: "Helps us plan for your compliance review.",
      },
      {
        name: "idealClient",
        label: "Who do you serve best?",
        type: "multiselect",
        options: [
          "Pre-retirees",
          "Retirees",
          "Business owners",
          "Physicians & professionals",
          "Federal / government employees",
          "High-net-worth families",
          "Young professionals",
          "Still defining my niche",
        ],
        hint: "Pick as many as apply.",
      },
    ],
  },
  {
    id: "services",
    title: "Services",
    blurb: "Tell us which services you'd like your team to take on.",
    fields: [
      {
        name: "services",
        label: "Services you're interested in",
        type: "multiselect",
        required: true,
        options: [
          "Google My Business Profile Setup & Management",
          "Search Engine Optimization",
          "Google Knowledge Panel",
          "Newsletter Marketing Services",
          "Review Management System",
          "Printing Services",
          "Lead Generation",
          "Appointment Booking",
        ],
        hint: "Select at least one. Not sure? Pick what sounds closest — we'll sort out the details on your kickoff call.",
      },
      {
        name: "currentMarketing",
        label: "How is your marketing handled today?",
        type: "radio",
        required: true,
        options: [
          "Nothing consistent yet",
          "I do it myself when I have time",
          "A vendor or freelancer handles some of it",
          "We have an in-house marketing person",
          "My broker-dealer provides materials",
        ],
      },
    ],
  },
  {
    id: "goals",
    title: "Your goals",
    blurb: "Last step. This is what we'll build your onboarding plan around.",
    fields: [
      {
        name: "primaryGoal",
        label: "Your #1 goal for the next 12 months",
        type: "radio",
        required: true,
        options: [
          "Bring in more qualified leads",
          "Build a recognizable brand",
          "Launch a new practice",
          "Fill seminars & client events",
          "Improve client experience & retention",
          "Modernize an outdated brand",
          "Earn more referrals",
        ],
      },
      {
        name: "clientGoal",
        label: "New clients you'd like to add per month",
        type: "select",
        half: true,
        options: ["1–2", "3–5", "6–10", "10+", "Not sure yet"],
      },
      {
        name: "timeline",
        label: "When would you like to start?",
        type: "select",
        required: true,
        half: true,
        options: ["Right away", "Within 30 days", "In 60–90 days", "Just exploring for now"],
      },
      {
        name: "budget",
        label: "Monthly marketing budget",
        type: "select",
        half: true,
        options: ["Under $500", "$500–$1,000", "$1,000–$2,500", "$2,500–$5,000", "$5,000+", "Prefer to discuss"],
        hint: "Optional — it just helps us scope realistically.",
      },
      {
        name: "preferredContact",
        label: "Best way to reach you",
        type: "radio",
        required: true,
        half: true,
        options: ["Email", "Text message", "Phone call"],
      },
      {
        name: "challenge",
        label: "What's the biggest thing getting in the way right now?",
        type: "textarea",
        maxLength: 1200,
        placeholder: "Tell us in a sentence or two — the more specific, the better your blueprint.",
      },
      {
        name: "consent",
        label:
          "I agree to receive emails and text messages from One Stop Print & Digital Solutions about my onboarding. Message and data rates may apply; reply STOP to opt out at any time.",
        type: "consent",
        required: true,
      },
    ],
  },
];

/** Flat list of every field, in order. */
export const ALL_FIELDS: Field[] = STEPS.flatMap((step) => step.fields);

/** Lookup from field name to its definition. */
export const FIELD_BY_NAME: Record<string, Field> = Object.fromEntries(
  ALL_FIELDS.map((field) => [field.name, field]),
);
