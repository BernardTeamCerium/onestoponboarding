import OnboardingForm from "@/components/OnboardingForm";
import { STEPS } from "@/lib/questionnaire";
import { site, NEXT_STEPS } from "@/lib/site";

/** Wordmark: "One" in ink, "Stop" in orange, over the two-line lockup. */
function Logo() {
  return (
    <a className="logo" href={site.website}>
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 46 46" role="presentation" focusable="false">
          <circle
            cx="25"
            cy="23"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="66 32"
            transform="rotate(-125 25 23)"
          />
          <circle cx="8" cy="13" r="2.8" fill="currentColor" />
          <circle cx="2.5" cy="22" r="1.9" fill="currentColor" opacity="0.6" />
          <circle cx="8" cy="31" r="1.4" fill="currentColor" opacity="0.35" />
        </svg>
      </span>
      <span className="logo-text">
        <span className="logo-word">
          One<span className="logo-accent">Stop</span>
        </span>
        {site.logoSubLines.map((line) => (
          <span className="logo-sub" key={line}>
            {line}
          </span>
        ))}
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
          <span>{site.packageName}</span>
          <span className="topbar-sep" aria-hidden="true">
            |
          </span>
          <span className="topbar-accent">Advisor Onboarding</span>
        </div>
      </div>

      <header className="header">
        <div className="wrap header-inner">
          <Logo />
          <div className="header-actions">
            <a className="header-link" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            <a className="btn btn-primary btn-sm" href={site.phoneHref}>
              {site.phone}
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <h1>
                Let&apos;s Get You
                <br />
                <span className="accent">Online.</span>
              </h1>
              <p className="hero-lede">
                <strong>Your website comes first.</strong> Everything else in your{" "}
                {site.packageName} connects to it — so we start by getting you a site that works.
              </p>
              <p className="hero-sub">
                A few questions about you, your practice and what you already have. Then we build,
                review and launch.
              </p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#questionnaire">
                  Start the questionnaire <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>

            {/* Mirrors the dark performance panel on the brand site. */}
            <aside className="panel">
              <div className="panel-head">
                <span className="panel-dot" aria-hidden="true" />
                <span className="panel-title">Onboarding Sequence</span>
                <span className="badge badge-orange">
                  {STEPS.length} steps · ~{site.estimatedMinutes} min
                </span>
              </div>

              <div className="panel-rule" />

              <ol className="panel-steps">
                {NEXT_STEPS.map((step, index) => (
                  <li className="panel-step" key={step.title}>
                    <span className="panel-num" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="panel-when">{step.when}</span>
                      <span className="panel-step-title">{step.title}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="panel-rule" />

              <div className="panel-foot">
                <span className="panel-check" aria-hidden="true">
                  ✓
                </span>
                <span>Answers go straight to your build team</span>
                <span className="badge badge-mute">Private</span>
              </div>
            </aside>
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
