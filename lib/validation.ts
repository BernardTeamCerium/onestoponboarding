import { z } from "zod";
import { ALL_FIELDS, type Field } from "./questionnaire";

const TRIM_MAX = 2000;

function schemaForField(field: Field): z.ZodTypeAny {
  const max = field.maxLength ?? TRIM_MAX;

  switch (field.type) {
    case "consent":
      return field.required
        ? z.literal(true, { errorMap: () => ({ message: "Please check this box to continue." }) })
        : z.boolean().optional().default(false);

    case "multiselect": {
      const base = z.array(z.string().max(max)).max(40);
      return field.required ? base.min(1, "Please choose at least one option.") : base.optional().default([]);
    }

    case "email": {
      const base = z.string().trim().max(max).email("Please enter a valid email address.");
      return field.required ? base : base.or(z.literal("")).optional();
    }

    case "tel": {
      const base = z
        .string()
        .trim()
        .max(max)
        .regex(/^[0-9+()\-.\s]{7,}$/, "Please enter a valid phone number.");
      return field.required ? base : base.or(z.literal("")).optional();
    }

    case "select":
    case "radio": {
      // Answers must be one of the offered options — no free text sneaking in.
      const options = field.options ?? [];
      const base = z.string().trim().refine((value) => options.includes(value), {
        message: "Please choose one of the options.",
      });
      return field.required ? base : z.string().trim().max(max).optional().default("");
    }

    default: {
      const base = z.string().trim().max(max);
      return field.required ? base.min(1, "This field is required.") : base.optional().default("");
    }
  }
}

const answerShape = Object.fromEntries(
  ALL_FIELDS.map((field) => [field.name, schemaForField(field)]),
) as Record<string, z.ZodTypeAny>;

/** The questionnaire answers, validated the same way on the client and the server. */
export const answersSchema = z.object(answerShape);

/** What the browser actually POSTs to /api/onboarding. */
export const submissionSchema = z.object({
  answers: answersSchema,
  meta: z
    .object({
      pageUrl: z.string().max(500).optional(),
      referrer: z.string().max(500).optional(),
      utmSource: z.string().max(200).optional(),
      utmMedium: z.string().max(200).optional(),
      utmCampaign: z.string().max(200).optional(),
      utmTerm: z.string().max(200).optional(),
      utmContent: z.string().max(200).optional(),
    })
    .partial()
    .optional()
    .default({}),
  /** Honeypot: bots fill it in, humans never see it. */
  company_website: z.string().max(200).optional().default(""),
});

export type Answers = z.infer<typeof answersSchema>;
export type Submission = z.infer<typeof submissionSchema>;

/**
 * Flattens zod issues into a `{ fieldName: message }` map the form can render
 * next to the offending inputs.
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    // Paths look like ["answers", "email"] on the server and ["email"] on the client.
    const key = issue.path.filter((part) => part !== "answers")[0];
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
