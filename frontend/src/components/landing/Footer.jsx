
import './Footer.css'

const ShieldIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16">
    <path d="M8 1L1 5v6l7 4 7-4V5L8 1zm0 2.2L13 6v4l-5 2.8L3 10V6l5-2.8z" fill="currentColor"/>
  </svg>
)

export default function Footer() {
  return (
    <footer className="footer">
      <a href="#" className="footer-logo">
        <div className="logo-icon" style={{ width: 22, height: 22, background: 'var(--red)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <ShieldIcon />
        </div>
        ThreatLens
      </a>

      <ul className="footer-links">
        <li><a href="#">Privacy</a></li>
        <li><a href="#">Terms</a></li>
        <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
        <li><a href="#">Contact</a></li>
      </ul>

      <div className="footer-copy">Built for Beyond Tomorrow Hackathon 2026</div>
    </footer>
  )
}
