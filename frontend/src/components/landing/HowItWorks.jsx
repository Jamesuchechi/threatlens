
import { useReveal } from '../../hooks/useReveal'
import './HowItWorks.css'

const steps = [
  {
    num: '01',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M9 9h6v6H9z"/></svg>
    ),
    title: 'Ingest live feeds',
    desc: 'Every 6 hours, ThreatLens pulls fresh data from the NVD, CISA Known Exploited Vulnerabilities catalog, and AbuseIPDB — hundreds of new vulnerabilities per day.',
  },
  {
    num: '02',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    ),
    title: 'Score & prioritize',
    desc: 'A composite risk engine weighs CVSS severity, active exploitation status, and AI-assessed business impact to produce a single priority score from 1–10.',
  },
  {
    num: '03',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
    title: 'AI translates it',
    desc: 'Each threat is passed to an AI model that writes a plain-English summary: what it is, who\'s at risk, what a real attacker would do with it — no jargon.',
  },
  {
    num: '04',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
    ),
    title: 'Alert your team',
    desc: 'Threats matching your industry and tech stack trigger instant alerts via email, Slack, or webhook — with concrete remediation steps attached.',
  },
]

export default function HowItWorks() {
  const ref = useReveal()

  return (
    <section id="how">
      <div className="section-inner">
        <div ref={ref} className="reveal">
          <div className="section-label">How it works</div>
          <h2 className="section-title">From raw CVE to clear action in seconds</h2>
          <p className="section-sub">
            ThreatLens runs a continuous intelligence pipeline so you always know what
            threatens your business — and exactly what to do about it.
          </p>
        </div>

        <div className="steps-grid reveal" ref={useReveal()}>
          {steps.map((step) => (
            <div className="step-card" key={step.num}>
              <div className="step-num">{step.num}</div>
              <div className="step-icon">{step.icon}</div>
              <div className="step-title">{step.title}</div>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
