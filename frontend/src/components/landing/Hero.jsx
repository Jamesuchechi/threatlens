
import { Link } from 'react-router-dom'
import './Hero.css'

const DashboardMock = () => (
  <div className="dashboard-mock">
    <div className="mock-topbar">
      <div className="mock-dots">
        <div className="mock-dot r" />
        <div className="mock-dot y" />
        <div className="mock-dot g" />
      </div>
      <div className="mock-url">app.threatlens.io/dashboard</div>
    </div>
    <div className="mock-body">
      <div className="mock-sidebar">
        <div className="mock-sidebar-logo">
          <div className="mock-sidebar-logo-icon">T</div>
          ThreatLens
        </div>
        <div className="mock-nav-item active">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Dashboard
        </div>
        <div className="mock-nav-item">
          <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Threats
        </div>
        <div className="mock-nav-item">
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Alerts
        </div>
        <div className="mock-nav-item">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Account
        </div>
      </div>
      <div className="mock-main">
        <div className="mock-stat-row">
          <div className="mock-stat"><div className="mock-stat-val red">12</div><div className="mock-stat-lbl">Critical</div></div>
          <div className="mock-stat"><div className="mock-stat-val amber">38</div><div className="mock-stat-lbl">High</div></div>
          <div className="mock-stat"><div className="mock-stat-val">197</div><div className="mock-stat-lbl">Total (7d)</div></div>
          <div className="mock-stat"><div className="mock-stat-val green">8</div><div className="mock-stat-lbl">Exploited</div></div>
        </div>
        <div className="mock-table">
          <div className="mock-table-head">
            <div className="mock-th">Severity</div>
            <div className="mock-th">Vulnerability</div>
            <div className="mock-th">Risk</div>
            <div className="mock-th">Published</div>
            <div className="mock-th">Patch</div>
          </div>
          {[
            { sev: 'sev-critical', sevLabel: 'Critical', title: 'Apache HTTP Server RCE — mod_rewrite', score: '9.8', scoreColor: '#E8392A', date: '2h ago', patch: true },
            { sev: 'sev-critical', sevLabel: 'Critical', title: 'Ivanti Connect Secure Auth Bypass', score: '9.1', scoreColor: '#E8392A', date: '5h ago', patch: false },
            { sev: 'sev-high',     sevLabel: 'High',     title: 'OpenSSL Buffer Overflow via TLS', score: '7.5', scoreColor: '#E88C2A', date: '12h ago', patch: true },
            { sev: 'sev-medium',   sevLabel: 'Medium',   title: 'WordPress Plugin XSS — Contact Form 7', score: '6.1', scoreColor: '#E8C72A', date: '1d ago', patch: true },
          ].map((row, i) => (
            <div className="mock-row" key={i}>
              <div><span className={`severity-badge ${row.sev}`}>{row.sevLabel}</span></div>
              <div className="mock-title">{row.title}</div>
              <div className="mock-score" style={{ color: row.scoreColor }}>{row.score}</div>
              <div className="mock-date">{row.date}</div>
              <div className={`mock-patch ${row.patch ? 'patch-yes' : 'patch-no'}`}>{row.patch ? '✓' : '✗'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-badge">
        <div className="pulse" />
        Live threat intelligence · Updated every 6 hours
      </div>

      <h1>
        Cyber threats,<br />
        explained in <em>plain English</em>
      </h1>

      <p className="hero-sub">
        ThreatLens ingests global vulnerability feeds and uses AI to translate complex threat
        data into clear, actionable intelligence — built for businesses without a security team.
      </p>

      <div className="hero-actions">
        <Link to="/register" className="btn-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Start for free
        </Link>
        <a href="#demo" className="btn-outline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
          See it live
        </a>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-num"><span>247</span></div>
          <div className="stat-label">New threats today</div>
        </div>
        <div className="stat-item">
          <div className="stat-num"><span>12</span></div>
          <div className="stat-label">Critical severity</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">43<span>%</span></div>
          <div className="stat-label">Attacks target SMBs</div>
        </div>
        <div className="stat-item">
          <div className="stat-num"><span>$200K</span></div>
          <div className="stat-label">Avg breach cost</div>
        </div>
      </div>

      <div className="preview-wrap">
        <div className="preview-label">dashboard preview</div>
        <DashboardMock />
      </div>
    </section>
  )
}
