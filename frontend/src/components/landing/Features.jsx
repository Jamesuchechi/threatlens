
import { useReveal } from '../../hooks/useReveal'
import './Features.css'

const features = [
  {
    accent: true,
    icon: <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    title: 'AI plain-English summaries',
    desc: 'Every vulnerability is translated from dense technical jargon into a two-paragraph explanation your whole team can understand, act on, and share.',
  },
  {
    icon: <svg viewBox="0 0 24 24"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>,
    title: 'Personalized alerts',
    desc: 'Tell us your industry and tech stack. We only alert you when a threat is actually relevant to your business — no noise, no spam.',
  },
  {
    icon: <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    title: 'Composite risk scoring',
    desc: 'Our risk engine combines CVSS scores, active exploitation data, and AI-assessed real-world business impact into a single 1–10 priority score.',
  },
  {
    icon: <svg viewBox="0 0 24 24"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>,
    title: 'Slack & webhook integration',
    desc: 'Push critical threat alerts directly to your Slack workspace or any webhook endpoint. Your team sees threats where they already work.',
  },
  {
    icon: <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    title: 'Domain monitoring',
    desc: 'Enter your domain and ThreatLens will watch for it in breach databases, phishing feeds, and credential dumps — alerting you before attackers use the data.',
  },
  {
    icon: <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    title: 'Patch tracker',
    desc: 'ThreatLens tracks CVEs against your declared tech stack and surfaces only the patches you actually need — with links to download and install them.',
  },
]

export default function Features() {
  const headRef = useReveal()
  const gridRef = useReveal()

  return (
    <section id="features">
      <div className="section-inner">
        <div ref={headRef} className="reveal">
          <div className="section-label">Features</div>
          <h2 className="section-title">Everything a security team does, automated</h2>
          <p className="section-sub">Built for people who run businesses, not cybersecurity analysts.</p>
        </div>

        <div ref={gridRef} className="features-grid reveal">
          {features.map((f, i) => (
            <div className={`feature-card${f.accent ? ' accent' : ''}`} key={i}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
