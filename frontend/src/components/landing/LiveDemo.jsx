
import { Link } from 'react-router-dom'
import { useReveal } from '../../hooks/useReveal'
import './LiveDemo.css'

const feedItems = [
  {
    title: 'Apache HTTP Server Remote Code Execution via mod_rewrite',
    sev: 'sev-critical',
    sevLabel: 'Critical',
    meta: 'CVE-2026-21310 · Score 9.8 · Patch available',
    summary: "A critical flaw in Apache lets attackers run any command on your server without a password. If your website runs on Apache, update immediately — attackers are already using this in the wild.",
  },
  {
    title: 'Ivanti Connect Secure Authentication Bypass',
    sev: 'sev-critical',
    sevLabel: 'Critical',
    meta: 'CVE-2026-22991 · Score 9.1 · No patch yet',
    summary: "Attackers can log into Ivanti VPN without any credentials. If your team uses Ivanti for remote access, disable external access and contact Ivanti support now.",
  },
  {
    title: 'OpenSSL Buffer Overflow via Malformed TLS Certificate',
    sev: 'sev-high',
    sevLabel: 'High',
    meta: 'CVE-2026-18843 · Score 7.5 · Patch available',
    summary: "A flaw in the encryption software used by most websites can crash your server when processing certain certificates. Update OpenSSL to the latest version.",
  },
]

export default function LiveDemo() {
  const headRef = useReveal()
  const feedRef = useReveal()

  return (
    <section id="demo" className="demo-section">
      <div className="section-inner">
        <div className="split">
          <div ref={headRef} className="reveal">
            <div className="section-label">Live intelligence</div>
            <h2 className="section-title">See what's threatening you right now</h2>
            <p className="section-sub">
              Every threat comes with an AI-written plain-English summary and step-by-step
              remediation guide — no security degree required.
            </p>
            <Link to="/register" className="btn-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              View all threats
            </Link>
          </div>

          <div ref={feedRef} className="feed-demo reveal">
            <div className="feed-header">
              <div className="feed-title-bar">
                <div className="live-dot" />
                Live threat feed
              </div>
              <div className="feed-badge">3 critical</div>
            </div>

            {feedItems.map((item, i) => (
              <div className="feed-item" key={i}>
                <div className="feed-item-top">
                  <div className="feed-item-title">{item.title}</div>
                  <span className={`severity-badge ${item.sev}`}>{item.sevLabel}</span>
                </div>
                <div className="feed-cve">{item.meta}</div>
                <div className="feed-ai-summary">
                  <div className="feed-ai-label">AI summary</div>
                  {item.summary}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
