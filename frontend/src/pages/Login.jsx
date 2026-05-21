import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useThreatStore } from '../store/threatStore'
import api from '../services/api'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = "Login | ThreatLens"
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Log in to ThreatLens to view your vulnerability intelligence dashboard and receive tailored alerts.')
    }
  }, [])

  const setAuth = useThreatStore((state) => state.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Authenticate with email/password
      const loginRes = await api.post('/auth/login', { email, password })
      const token = loginRes.data.token

      // Save token temporarily so interceptor can pick it up for the next call
      localStorage.setItem('threatlens_token', token)

      // 2. Retrieve detailed user profile details
      const userRes = await api.get('/auth/me')
      const user = userRes.data

      // 3. Save to store (this sets localStorage permanently)
      setAuth(user, token)

      // 4. Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : 'Failed to authenticate. Please check your credentials.'
      )
      // Clean up token if login failed
      localStorage.removeItem('threatlens_token')
    } finally {
      setLoading(false)
    }
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
            Enterprise threat intelligence, <em>unlocked</em>.
          </h1>
          <p className="auth-sidebar-text">
            Log in to access your customized dashboard, track active exploits targeting your stack, and manage automated alerts.
          </p>

          <div className="auth-stats">
            <div className="auth-stat-card">
              <div className="auth-stat-value red">12</div>
              <div className="auth-stat-label">Critical Alerts</div>
            </div>
            <div className="auth-stat-card">
              <div className="auth-stat-value">6h</div>
              <div className="auth-stat-label">Feed Refresh Cycle</div>
            </div>
          </div>
        </div>

        <div className="auth-sidebar-footer">
          © 2026 ThreatLens. All rights reserved.
        </div>
      </div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome Back</h2>
            <p className="auth-form-subtitle">
              Don't have an account? <Link to="/register">Create one for free</Link>
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
                  placeholder="••••••••"
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
            </div>

            <button
              type="submit"
              className="btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? <div className="auth-loading-spinner" /> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
