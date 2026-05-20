import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useThreatStore } from '../store/threatStore'
import api from '../services/api'
import './Auth.css'

const SUGGESTED_TECH = [
  'React',
  'Python',
  'PostgreSQL',
  'Docker',
  'AWS',
  'Redis',
  'Nginx',
  'Kubernetes',
  'Node.js',
  'MongoDB',
]

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [industry, setIndustry] = useState('Technology')
  const [techInput, setTechInput] = useState('')
  const [techStack, setTechStack] = useState(['React', 'PostgreSQL'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setAuth = useThreatStore((state) => state.setAuth)
  const navigate = useNavigate()

  // Calculate password strength directly from password during render (no useEffect needed)
  let strength = 0
  if (password) {
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
  }


  // Handle tech stack tags
  const handleAddTech = (tech) => {
    const cleaned = tech.trim()
    if (cleaned && !techStack.includes(cleaned)) {
      setTechStack([...techStack, cleaned])
    }
    setTechInput('')
  }

  const handleRemoveTech = (indexToRemove) => {
    setTechStack(techStack.filter((_, index) => index !== indexToRemove))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTech(techInput)
    } else if (e.key === 'Backspace' && !techInput && techStack.length > 0) {
      handleRemoveTech(techStack.length - 1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password || !industry) {
      setError('Please fill in all required fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Send registration request to backend
      const registerRes = await api.post('/auth/register', {
        name,
        email,
        password,
        industry,
        tech_stack: techStack,
      })
      const token = registerRes.data.token

      // Save token temporarily so interceptor can fetch `/auth/me`
      localStorage.setItem('threatlens_token', token)

      // 2. Retrieve detailed user profile details
      const userRes = await api.get('/auth/me')
      const user = userRes.data

      // 3. Save to store
      setAuth(user, token)

      // 4. Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : 'Failed to create account. Please check your details.'
      )
      // Clean up token if registration failed
      localStorage.removeItem('threatlens_token')
    } finally {
      setLoading(false)
    }
  }

  // Get CSS class names for strength bars
  const getStrengthClass = (barIndex) => {
    if (strength < barIndex) return ''
    if (strength === 1) return 'weak'
    if (strength === 2) return 'fair'
    if (strength === 3) return 'good'
    return 'strong'
  }

  const getStrengthText = () => {
    if (strength === 0) return ''
    if (strength === 1) return 'Weak (Add upper/lower, numbers, or symbols)'
    if (strength === 2) return 'Fair (Good mix of characters)'
    if (strength === 3) return 'Good'
    return 'Strong!'
  }

  return (
    <div className="auth-container">
      {/* Sidebar Panel */}
      <div className="auth-sidebar">
        <Link to="/" className="auth-sidebar-logo">
          <div className="auth-sidebar-logo-icon">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path d="M8 1L1 5v6l7 4 7-4V5L8 1zm0 2.2L13 6v4l-5 2.8L3 10V6l5-2.8z" fill="currentColor"/>
            </svg>
          </div>
          ThreatLens
        </Link>

        <div className="auth-sidebar-content">
          <h1 className="auth-sidebar-title">
            Tailored alerts. Zero <em>noise</em>.
          </h1>
          <p className="auth-sidebar-text">
            Configure your technical stack during sign-up to receive real-time, AI-summarized insights tailored to the software you deploy.
          </p>

          <div className="auth-stats">
            <div className="auth-stat-card">
              <div className="auth-stat-value green">24/7</div>
              <div className="auth-stat-label">Active Scanning</div>
            </div>
            <div className="auth-stat-card">
              <div className="auth-stat-value amber">99.8%</div>
              <div className="auth-stat-label">Alert Relevance</div>
            </div>
          </div>
        </div>

        <div className="auth-sidebar-footer">
          © 2026 ThreatLens. All rights reserved.
        </div>
      </div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-wrapper" style={{ margin: '40px 0' }}>
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create Account</h2>
            <p className="auth-form-subtitle">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>

          {error && (
            <div className="auth-alert">
              <svg className="auth-alert-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>{error}</div>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="form-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              <div className="strength-meter">
                <div className={`strength-bar ${getStrengthClass(1)}`} />
                <div className={`strength-bar ${getStrengthClass(2)}`} />
                <div className={`strength-bar ${getStrengthClass(3)}`} />
                <div className={`strength-bar ${getStrengthClass(4)}`} />
              </div>
              {strength > 0 && <span className="strength-text">{getStrengthText()}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Industry</label>
              <select
                className="form-select"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={loading}
              >
                <option value="Technology">Technology & Software</option>
                <option value="Finance">Finance & Banking</option>
                <option value="Healthcare">Healthcare & Medicine</option>
                <option value="Retail">Retail & E-commerce</option>
                <option value="Energy">Energy & Utilities</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tech Stack (Alert Scope)</label>
              <div className="tags-wrapper">
                {techStack.map((tech, index) => (
                  <span className="tag-item" key={tech}>
                    {tech}
                    <button
                      type="button"
                      className="tag-close"
                      onClick={() => handleRemoveTech(index)}
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="tag-input"
                  placeholder={techStack.length === 0 ? "e.g. React, Nginx" : "Add..."}
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                Press Enter to add tags. We'll monitor vulnerabilities matching this stack.
              </span>
              <div className="suggested-tags">
                {SUGGESTED_TECH.filter((t) => !techStack.includes(t)).map((tech) => (
                  <button
                    type="button"
                    className="suggested-tag-btn"
                    key={tech}
                    onClick={() => handleAddTech(tech)}
                    disabled={loading}
                  >
                    + {tech}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? <div className="auth-loading-spinner" /> : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
