import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'

const ShieldIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16">
    <path d="M8 1L1 5v6l7 4 7-4V5L8 1zm0 2.2L13 6v4l-5 2.8L3 10V6l5-2.8z" fill="currentColor"/>
  </svg>
)

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <a href="#" className="nav-logo">
        <div className="logo-icon">
          <ShieldIcon />
        </div>
        ThreatLens
      </a>

      <ul className="nav-links">
        <li><a href="#how">How it works</a></li>
        <li><a href="#features">Features</a></li>
        <li><a href="#demo">Live demo</a></li>
      </ul>

      <div className="nav-cta">
        <Link to="/login" className="btn-ghost">Sign in</Link>
        <Link to="/register" className="btn-primary">Get started</Link>
      </div>
    </nav>
  )
}
