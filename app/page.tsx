import OnboardingForm from "@/components/OnboardingForm";
import { STEPS } from "@/lib/questionnaire";
import { site, NEXT_STEPS } from "@/lib/site";

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
        <section className="intro">
          <div className="wrap intro-inner">
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              {site.packageName} · Onboarding
            </span>
            <h1>
              Let&apos;s get you <em>online</em>.
            </h1>
            <p className="intro-lede">
              Your {site.packageName} starts with your website. Answer a few questions about you,
              your practice and what you already have — then we build, review and launch.
            </p>
            <p className="intro-meta">
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
            © {new Date().getFullYear()} {site.company}. By submitting this questionnaire you agree
            to be contacted about your onboarding by email, phone and text. Reply STOP to any text
            to opt out.
          </p>
        </div>
      </footer>
    </>
  );
}
