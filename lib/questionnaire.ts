/**
 * Single source of truth for the onboarding questionnaire.
 *
 * The form UI, the validation schema and the GoHighLevel payload are all
 * derived from this file, so adding or renaming a question only happens here.
 *
 * The package starts with the advisor's website — step three is the centre of
 * gravity, and everything else hangs off it.
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

/** The services that surround the website, offered on step four. */
export const PACKAGE_SERVICES = [
  "Google My Business Profile Setup & Management",
  "Search Engine Optimization",
  "Google Knowledge Panel",
  "Newsletter Marketing Services",
  "Review Management System",
  "Printing Services",
  "Lead Generation",
  "Appointment Booking",
];

export const STEPS: Step[] = [
  {
    id: "personal",
    title: "About you",
    blurb: "How your name appears online, and how we reach you while we build.",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true, half: true, maxLength: 60, placeholder: "Jordan" },
      { name: "lastName", label: "Last name", type: "text", required: true, half: true, maxLength: 60, placeholder: "Rivera" },
      { name: "email", label: "Work email", type: "email", required: true, half: true, maxLength: 160, placeholder: "you@yourfirm.com" },
      { name: "phone", label: "Mobile phone", type: "tel", required: true, half: true, maxLength: 32, placeholder: "(305) 555-0142" },
      { name: "cityState", label: "City & state", type: "text", half: true, maxLength: 80, placeholder: "Miami, FL", hint: "Used for your local search listing." },
      {
        name: "designations",
        label: "Designations",
        type: "text",
        half: true,
        maxLength: 120,
        placeholder: "CFP®, ChFC®",
        hint: "Exactly as you want them shown on your site.",
      },
    ],
  },
  {
    id: "professional",
    title: "Your practice",
    blurb: "Your background becomes the copy on your site — and sets the compliance path.",
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
        hint: "Tells us how many bios to build.",
      },
      {
        name: "affiliation",
        label: "Broker-dealer / RIA affiliation",
        type: "text",
        half: true,
        maxLength: 120,
        placeholder: "e.g. LPL, Independent RIA",
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
        hint: "Pick as many as apply — this shapes who your site speaks to.",
      },
    ],
  },
  {
    id: "website",
    title: "Your website",
    blurb: "Your package starts here. Everything else connects to it.",
    fields: [
      {
        name: "currentSite",
        label: "Where are you today?",
        type: "radio",
        required: true,
        options: [
          "I'm not online yet",
          "I have a site, but it needs replacing",
          "I have a site that just needs updating",
          "I only have a page on my firm's website",
          "Not sure what I have",
        ],
      },
      {
        name: "currentSiteUrl",
        label: "Current site address",
        type: "text",
        half: true,
        maxLength: 200,
        placeholder: "yourfirm.com",
        hint: "Leave blank if you don't have one.",
      },
      {
        name: "domainIdea",
        label: "Domain you own or want",
        type: "text",
        half: true,
        maxLength: 200,
        placeholder: "riverawealth.com",
      },
      {
        name: "domainStatus",
        label: "Domain status",
        type: "select",
        required: true,
        options: [
          "I already own my domain",
          "I own it, but I'm not sure how to access it",
          "I need help registering one",
          "Not sure",
        ],
      },
      {
        name: "sitePriority",
        label: "What should your site do first?",
        type: "radio",
        required: true,
        options: [
          "Make me look credible when someone searches my name",
          "Let people book time with me",
          "Explain what I do and who I help",
          "Collect enquiries from new prospects",
          "Give clients one place to find everything",
        ],
      },
      {
        name: "assets",
        label: "What do you already have ready?",
        type: "multiselect",
        options: [
          "Logo files",
          "Professional headshot",
          "Written bio",
          "Team photos",
          "Client testimonials",
          "Brand colors / style guide",
          "Compliance-approved copy",
          "None of these yet",
        ],
        hint: "Whatever's missing, we'll produce — just tell us where you stand.",
      },
    ],
  },
  {
    id: "services",
    title: "Your package",
    blurb: "Your website is the foundation. Tell us what to switch on around it.",
    fields: [
      {
        name: "services",
        label: "Include in my package",
        type: "multiselect",
        required: true,
        options: PACKAGE_SERVICES,
        hint: "Select at least one. Not sure? Pick what sounds closest — we'll sort out the details on your kickoff call.",
      },
      {
        name: "servicePriority",
        label: "After the website, what should we set up first?",
        type: "select",
        options: [...PACKAGE_SERVICES, "Not sure — you decide the order"],
      },
    ],
  },
  {
    id: "goals",
    title: "Getting started",
    blurb: "Last step. This is what we'll build your launch plan around.",
    fields: [
      {
        name: "primaryGoal",
        label: "What matters most about being online?",
        type: "radio",
        required: true,
        options: [
          "Looking credible when someone searches my name",
          "Having one place to send prospects and clients",
          "Letting people book time with me directly",
          "Showing up in local search results",
          "Replacing something that's out of date",
          "Getting online for the first time",
        ],
      },
      {
        name: "timeline",
        label: "When would you like to be live?",
        type: "select",
        required: true,
        half: true,
        options: ["As soon as possible", "Within 30 days", "In 60–90 days", "No fixed date yet"],
      },
      {
        name: "complianceReview",
        label: "Does your firm require compliance review?",
        type: "select",
        required: true,
        half: true,
        options: ["Yes", "No", "Not sure"],
        hint: "We'll build to whatever your BD or RIA needs.",
      },
      {
        name: "preferredContact",
        label: "Best way to reach you",
        type: "radio",
        required: true,
        options: ["Email", "Text message", "Phone call"],
      },
      {
        name: "notes",
        label: "Anything else we should know?",
        type: "textarea",
        maxLength: 1200,
        placeholder: "Sites you like, things you want to avoid, a launch date you're working towards…",
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
