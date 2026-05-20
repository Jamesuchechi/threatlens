import './Ticker.css'

const ITEMS = [
  { color: '#E8392A', text: 'CVE-2026-21310 — Apache RCE — CVSS 9.8' },
  { color: '#E88C2A', text: 'CVE-2026-18843 — OpenSSL Buffer Overflow — CVSS 7.5' },
  { color: '#E8392A', text: 'CISA KEV — CVE-2026-20041 — Actively Exploited' },
  { color: '#E8C72A', text: 'CVE-2026-15560 — WordPress Plugin XSS — CVSS 6.1' },
  { color: '#E8392A', text: 'CVE-2026-22991 — Ivanti Auth Bypass — CVSS 9.1' },
  { color: '#E88C2A', text: 'CVE-2026-17220 — MySQL Privilege Escalation — CVSS 7.2' },
]

// Duplicate for seamless loop
const ALL = [...ITEMS, ...ITEMS]

export default function Ticker() {
  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {ALL.map((item, i) => (
          <div className="ticker-item" key={i}>
            <div className="dot" style={{ background: item.color }} />
            {item.text}
          </div>
        ))}
      </div>
    </div>
  )
}
