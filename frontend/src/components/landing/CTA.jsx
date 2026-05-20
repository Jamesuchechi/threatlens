
import { Link } from 'react-router-dom'
import { useReveal } from '../../hooks/useReveal'
import './CTA.css'

export default function CTA() {
  const ref = useReveal()

  return (
    <section className="cta-section">
      <div ref={ref} className="cta-inner reveal">
        <div className="section-label">Get protected</div>
        <h2 className="cta-title">Your business deserves enterprise-grade intelligence</h2>
        <p className="cta-sub">
          Free to start. No credit card. No security expertise required. Set up in under 5 minutes.
        </p>
        <div className="cta-actions">
          <Link to="/register" className="btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Create free account
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
