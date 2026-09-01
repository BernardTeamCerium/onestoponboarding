import OnboardingForm from "@/components/OnboardingForm";
import { site, NEXT_STEPS, HERO_POINTS } from "@/lib/site";

export default function Home() {
  return (
    <>
      <header className="header">
        <div className="wrap header-inner">
          <a className="logo" href={site.website}>
            <span className="logo-mark" aria-hidden="true">
              1S
            </span>
            <span className="logo-text">
              <span className="logo-name">{site.shortName}</span>
              <span className="logo-sub">Print &amp; Digital Solutions</span>
            </span>
          </a>
          <div className="header-contact">
            <a href={site.phoneHref}>{site.phone}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow">
                <span className="eyebrow-dot" aria-hidden="true" />
                Advisor Onboarding
              </span>
              <h1>
                Let&apos;s build the marketing engine your <em>practice</em> deserves.
              </h1>
              <p className="hero-lede">
                You&apos;re {site.estimatedMinutes} minutes away from a custom marketing blueprint.
                Tell us about your practice, the services you&apos;re interested in and what you want
                to grow — we&apos;ll handle the rest, from brand and print to your website, CRM and
                follow-up.
              </p>
              <ul className="hero-points">
                {HERO_POINTS.map((point) => (
                  <li key={point}>
                    <span className="check" aria-hidden="true">
                      ✓
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#questionnaire">
                  Start the questionnaire
                </a>
                <span className="hero-meta">
                  About {site.estimatedMinutes} minutes · No obligation
                </span>
              </div>
            </div>

            <aside className="hero-card">
              <h2>What happens after you submit</h2>
              <p className="hero-card-sub">No mystery, no waiting around wondering.</p>
              <ol className="mini-steps">
                {NEXT_STEPS.map((step, index) => (
                  <li className="mini-step" key={step.title}>
                    <span className="mini-num" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span>
                      <span className="mini-when">{step.when}</span>
                      <span className="mini-title">{step.title}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section className="section section-white" id="next-steps">
          <div className="wrap">
            <div className="section-head">
              <span className="kicker">Your roadmap</span>
              <h2>Here&apos;s exactly what to expect</h2>
              <p>
                Every advisor we onboard follows the same clear path — so you always know where
                things stand and what&apos;s coming next.
              </p>
            </div>
            <div className="steps-grid">
              {NEXT_STEPS.map((step, index) => (
                <article className="step-card" key={step.title}>
                  <div className="step-num">Step {index + 1}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <span className="step-when">{step.when}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="form-section" id="questionnaire">
          <div className="wrap">
            <div className="section-head">
              <span className="kicker">Step 1 of your roadmap</span>
              <h2>Tell us about your practice</h2>
              <p>
                Four short sections: who you are, what you do, what you need and where you want to
                go. Nothing here is a commitment.
              </p>
            </div>
            <OnboardingForm />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <div className="logo" style={{ marginBottom: 14 }}>
                <span className="logo-mark" aria-hidden="true">
                  1S
                </span>
                <span className="logo-text">
                  <span className="logo-name">{site.shortName}</span>
                  <span className="logo-sub">Print &amp; Digital Solutions</span>
                </span>
              </div>
              <p style={{ margin: 0, maxWidth: "28em" }}>{site.tagline}</p>
            </div>
            <address className="footer-contact">
              <a href={site.phoneHref}>{site.phone}</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
              <span>{site.address}</span>
              <a href={site.website}>onestopprintco.com</a>
            </address>
          </div>
          <p className="footer-legal">
            © {new Date().getFullYear()} {site.company}. By submitting the questionnaire you agree
            to be contacted about your onboarding by email, phone and text. Reply STOP to any text
            to opt out.
          </p>
        </div>
      </footer>
    </>
  );
}
