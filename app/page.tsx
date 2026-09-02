import OnboardingForm from "@/components/OnboardingForm";
import { STEPS } from "@/lib/questionnaire";
import { site, NEXT_STEPS } from "@/lib/site";

/** Wordmark: "One" in ink, "Stop" in orange, with the two-line lockup beneath. */
function Logo() {
  return (
    <a className="logo" href={site.website}>
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 44 44" role="presentation" focusable="false">
          <circle
            cx="23"
            cy="22"
            r="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeDasharray="62 30"
            transform="rotate(-125 23 22)"
          />
          <circle cx="8" cy="14" r="2.6" fill="currentColor" />
          <circle cx="3" cy="22" r="1.8" fill="currentColor" opacity="0.6" />
          <circle cx="9" cy="30" r="1.4" fill="currentColor" opacity="0.35" />
        </svg>
      </span>
      <span className="logo-text">
        <span className="logo-word">
          One<span className="logo-accent">Stop</span>
        </span>
        <span className="logo-sub">{site.logoSub}</span>
      </span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <span className="topbar-dot" aria-hidden="true" />
          {site.packageName} · Onboarding
        </div>
      </div>

      <header className="header">
        <div className="wrap header-inner">
          <Logo />
          <div className="header-contact">
            <a href={site.phoneHref}>{site.phone}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap hero-inner">
            <h1>
              Let&apos;s Get You <span className="accent">Online.</span>
            </h1>
            <p className="hero-lede">
              <strong>Your website comes first.</strong> Everything else in your{" "}
              {site.packageName} connects to it — so we start by getting you a site that works.
            </p>
            <p className="hero-sub">
              A few questions about you, your practice and what you already have. Then we build,
              review and launch.
            </p>
            <p className="hero-meta">
              {site.estimatedMinutes} min · {STEPS.length} steps · What happens next
            </p>

            <ol className="strip">
              {NEXT_STEPS.map((step, index) => (
                <li className="strip-item" key={step.title}>
                  <span className="strip-num" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="strip-when">{step.when}</span>
                  <span className="strip-title">{step.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="form-section" id="questionnaire">
          <div className="wrap">
            <OnboardingForm />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                <Logo />
              </div>
              <p style={{ margin: 0, maxWidth: "30em" }}>{site.tagline}</p>
            </div>
            <address className="footer-contact">
              <a href={site.phoneHref}>{site.phone}</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
              <span>{site.address}</span>
              <a href={site.website}>onestopprintco.com</a>
            </address>
          </div>
          <p className="footer-legal">
            © {new Date().getFullYear()} {site.company}. By submitting this questionnaire you agree
            to be contacted about your onboarding by email, phone and text. Reply STOP to any text
            to opt out.
          </p>
        </div>
      </footer>
    </>
  );
}
