"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { STEPS, type Field } from "@/lib/questionnaire";
import { answersSchema, fieldErrors, type Answers } from "@/lib/validation";
import { site, NEXT_STEPS } from "@/lib/site";

type Values = Record<string, string | string[] | boolean>;
type Meta = Record<string, string>;

function initialValues(): Values {
  const values: Values = {};
  for (const step of STEPS) {
    for (const field of step.fields) {
      values[field.name] = field.type === "multiselect" ? [] : field.type === "consent" ? false : "";
    }
  }
  return values;
}

/** Pulls page context and any UTM tags so GoHighLevel can attribute the lead. */
function readMeta(): Meta {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const meta: Meta = {
    pageUrl: window.location.href.slice(0, 500),
    referrer: document.referrer.slice(0, 500),
  };
  const utm = {
    utmSource: "utm_source",
    utmMedium: "utm_medium",
    utmCampaign: "utm_campaign",
    utmTerm: "utm_term",
    utmContent: "utm_content",
  } as const;
  for (const [key, param] of Object.entries(utm)) {
    const value = params.get(param);
    if (value) meta[key] = value.slice(0, 200);
  }
  return meta;
}

export default function OnboardingForm() {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [meta, setMeta] = useState<Meta>({});
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMeta(readMeta());
  }, []);

  const step = STEPS[stepIndex]!;
  const isLast = stepIndex === STEPS.length - 1;
  const progress = done ? 100 : Math.round((stepIndex / STEPS.length) * 100);

  /** Per-step slice of the shared schema, so each step validates on its own. */
  const stepSchema = useMemo(() => {
    const mask: Record<string, true> = {};
    for (const field of step.fields) mask[field.name] = true;
    return answersSchema.pick(mask);
  }, [step]);

  function setValue(name: string, value: string | string[] | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function toggleOption(name: string, option: string) {
    const current = (values[name] as string[]) ?? [];
    setValue(
      name,
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  }

  function scrollToTop() {
    shellRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Validates the visible step; returns true when it's clear to move on. */
  function validateStep(): boolean {
    const slice: Values = {};
    for (const field of step.fields) slice[field.name] = values[field.name]!;

    const result = stepSchema.safeParse(slice);
    if (result.success) {
      setErrors({});
      return true;
    }
    setErrors(fieldErrors(result.error));
    setFormError("Please check the highlighted answers below.");
    return false;
  }

  function goBack() {
    setFormError("");
    setErrors({});
    setStepIndex((index) => Math.max(0, index - 1));
    scrollToTop();
  }

  function goNext() {
    if (!validateStep()) return;
    setFormError("");
    setStepIndex((index) => Math.min(STEPS.length - 1, index + 1));
    scrollToTop();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (!isLast) {
      goNext();
      return;
    }
    if (!validateStep()) {
      scrollToTop();
      return;
    }

    // Final belt-and-braces check across every step before we send.
    const parsed = answersSchema.safeParse(values);
    if (!parsed.success) {
      const found = fieldErrors(parsed.error);
      setErrors(found);
      const firstBadStep = STEPS.findIndex((candidate) =>
        candidate.fields.some((field) => found[field.name]),
      );
      if (firstBadStep >= 0) setStepIndex(firstBadStep);
      setFormError("Please check the highlighted answers below.");
      scrollToTop();
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: parsed.data as Answers,
          meta,
          company_website: values.company_website ?? "",
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok || !data.ok) {
        if (data.errors && Object.keys(data.errors).length > 0) {
          setErrors(data.errors);
          const firstBadStep = STEPS.findIndex((candidate) =>
            candidate.fields.some((field) => data.errors![field.name]),
          );
          if (firstBadStep >= 0) setStepIndex(firstBadStep);
        }
        setFormError(
          data.message ??
            `Something went wrong on our end. Please try again, or call us at ${site.phone}.`,
        );
        scrollToTop();
        return;
      }

      setDone(true);
      scrollToTop();
    } catch {
      setFormError(
        `We couldn't reach our servers. Please check your connection and try again, or call us at ${site.phone}.`,
      );
      scrollToTop();
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const firstName = String(values.firstName ?? "").trim();
    return (
      <div className="form-shell" ref={shellRef}>
        <div className="form-top">
          <div className="form-top-row">
            <h2>All done</h2>
            <span className="step-count">
              <b>Complete</b>
            </span>
          </div>
          <div className="progress">
            <div className="progress-bar" style={{ width: "100%" }} />
          </div>
        </div>
        <div className="thanks">
          <div className="thanks-badge" aria-hidden="true">
            ✓
          </div>
          <h2>{firstName ? `Thanks, ${firstName} — you're all set.` : "Thanks — you're all set."}</h2>
          <p>
            Your answers are in and your file is already with your account team. Here&apos;s
            exactly what happens next.
          </p>

          <ol className="thanks-list">
            {NEXT_STEPS.map((nextStep, index) => (
              <li className="thanks-item" key={nextStep.title}>
                <span className="mini-num" aria-hidden="true">
                  {index + 1}
                </span>
                <span>
                  <span className="mini-when">{nextStep.when}</span>
                  <h3>{nextStep.title}</h3>
                  <p>{nextStep.description}</p>
                </span>
              </li>
            ))}
          </ol>

          <div className="thanks-cta">
            {site.bookingUrl ? (
              <>
                <p>Want to skip the phone tag? Grab a time that works for you right now.</p>
                <a
                  className="btn btn-primary"
                  href={site.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book my discovery call
                </a>
              </>
            ) : (
              <p>
                Something urgent in the meantime? Call us at{" "}
                <a href={site.phoneHref}>{site.phone}</a> or email{" "}
                <a href={`mailto:${site.email}`}>{site.email}</a>.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-shell" ref={shellRef}>
      <div className="form-top">
        <div className="form-top-row">
          <h2>{step.title}</h2>
          <span className="step-count">
            Step <b>{String(stepIndex + 1).padStart(2, "0")}</b> /{" "}
            {String(STEPS.length).padStart(2, "0")}
          </span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Questionnaire progress"
        >
          <div className="progress-bar" style={{ width: `${Math.max(progress, 4)}%` }} />
        </div>
      </div>

      <form className="form-body" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <p className="form-alert" role="alert">
            {formError}
          </p>
        ) : null}

        <p className="step-blurb">{step.blurb}</p>

        <div className="fields">
          {step.fields.map((field) => (
            <FieldRow
              key={field.name}
              field={field}
              value={values[field.name]!}
              error={errors[field.name]}
              onChange={setValue}
              onToggle={toggleOption}
            />
          ))}

          {/* Honeypot — hidden from people, catnip for bots. */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
          >
            <label htmlFor="company_website">Company website</label>
            <input
              id="company_website"
              name="company_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={String(values.company_website ?? "")}
              onChange={(event) => setValue("company_website", event.target.value)}
            />
          </div>
        </div>

        <div className="form-nav">
          {stepIndex > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={goBack} disabled={submitting}>
              ← Back
            </button>
          ) : (
            <span />
          )}

          {isLast ? (
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Sending…" : "Submit and see next steps"}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={goNext}>
              Continue →
            </button>
          )}
        </div>

        <p className="form-note">
          Your answers go straight to your account team. We never sell or share them.
        </p>
      </form>
    </div>
  );
}

interface FieldRowProps {
  field: Field;
  value: string | string[] | boolean;
  error?: string;
  onChange: (name: string, value: string | string[] | boolean) => void;
  onToggle: (name: string, option: string) => void;
}

function FieldRow({ field, value, error, onChange, onToggle }: FieldRowProps) {
  const errorId = `${field.name}-error`;
  const hintId = `${field.name}-hint`;
  const describedBy = [field.hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  const className = [
    "field",
    field.half ? "field-half" : "",
    error ? "has-error" : "",
    field.type === "consent" ? "consent" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const labelNode = (
    <>
      {field.label}
      {field.required ? (
        <span className="req" aria-hidden="true">
          *
        </span>
      ) : (
        <span className="optional">optional</span>
      )}
    </>
  );

  if (field.type === "consent") {
    return (
      <div className={className}>
        <label htmlFor={field.name}>
          <input
            id={field.name}
            name={field.name}
            type="checkbox"
            checked={value === true}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            onChange={(event) => onChange(field.name, event.target.checked)}
          />
          <span>{field.label}</span>
        </label>
        {error ? (
          <p className="error" id={errorId}>
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === "radio" || field.type === "multiselect") {
    const options = field.options ?? [];
    const selected = field.type === "multiselect" ? (value as string[]) : [];
    const gridClass = `option-grid${options.length > 5 ? " option-grid-2" : ""}`;

    return (
      <fieldset className={className} aria-describedby={describedBy || undefined}>
        <legend className="field-legend">{labelNode}</legend>
        {field.hint ? (
          <p className="hint" id={hintId}>
            {field.hint}
          </p>
        ) : null}
        <div className={gridClass}>
          {options.map((option) => {
            const isSelected =
              field.type === "multiselect" ? selected.includes(option) : value === option;
            return (
              <label
                key={option}
                className={`option${isSelected ? " is-selected" : ""}`}
              >
                <input
                  type={field.type === "multiselect" ? "checkbox" : "radio"}
                  name={field.name}
                  value={option}
                  checked={isSelected}
                  onChange={() =>
                    field.type === "multiselect"
                      ? onToggle(field.name, option)
                      : onChange(field.name, option)
                  }
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
        {error ? (
          <p className="error" id={errorId}>
            {error}
          </p>
        ) : null}
      </fieldset>
    );
  }

  return (
    <div className={className}>
      <label htmlFor={field.name}>{labelNode}</label>

      {field.type === "textarea" ? (
        <textarea
          id={field.name}
          name={field.name}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          value={String(value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          onChange={(event) => onChange(field.name, event.target.value)}
        />
      ) : field.type === "select" ? (
        <select
          id={field.name}
          name={field.name}
          value={String(value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          onChange={(event) => onChange(field.name, event.target.value)}
        >
          <option value="">Select one…</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={field.name}
          name={field.name}
          type={field.type === "url" ? "text" : field.type}
          inputMode={field.type === "tel" ? "tel" : undefined}
          autoComplete={autoCompleteFor(field.name)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          value={String(value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          onChange={(event) => onChange(field.name, event.target.value)}
        />
      )}

      {field.hint ? (
        <p className="hint" id={hintId}>
          {field.hint}
        </p>
      ) : null}

      {error ? (
        <p className="error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function autoCompleteFor(name: string): string | undefined {
  const map: Record<string, string> = {
    firstName: "given-name",
    lastName: "family-name",
    email: "email",
    phone: "tel",
    firmName: "organization",
    website: "url",
  };
  return map[name];
}
