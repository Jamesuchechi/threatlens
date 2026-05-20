import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  X, 
  Lock, 
  Mail, 
  Globe 
} from 'lucide-react'
import { useThreatStore } from '../store/threatStore'
import api from '../services/api'
import Layout from '../components/common/Layout'
import './Settings.css'

export default function Settings() {
  const user = useThreatStore((state) => state.user)
  const token = useThreatStore((state) => state.token)
  const setAuth = useThreatStore((state) => state.setAuth)
  const navigate = useNavigate()

  // State fields
  const [name, setName] = useState(() => user?.name || '')
  const [industry, setIndustry] = useState(() => user?.industry || 'technology')
  const [techStack, setTechStack] = useState(() => user?.tech_stack || [])
  const [newTech, setNewTech] = useState('')
  const [alertEmail, setAlertEmail] = useState(() => user?.alert_email_enabled !== false)
  const [webhookUrl, setWebhookUrl] = useState(() => user?.alert_webhook_url || '')

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!token || !user) {
      navigate('/login')
    }
  }, [token, user, navigate])

  const handleAddTech = (e) => {
    e.preventDefault()
    const cleanTech = newTech.trim()
    if (cleanTech && !techStack.includes(cleanTech)) {
      setTechStack([...techStack, cleanTech])
      setNewTech('')
    }
  }

  const handleRemoveTech = (techToRemove) => {
    setTechStack(techStack.filter((t) => t !== techToRemove))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await api.put('/auth/me', {
        name,
        industry: industry.toLowerCase(),
        tech_stack: techStack,
        alert_email_enabled: alertEmail,
        alert_webhook_url: webhookUrl || null
      })
      
      // Update state in Zustand store and localstorage
      setAuth(res.data, token)
      setSuccessMsg('Settings updated successfully.')
      
      setTimeout(() => {
        setSuccessMsg('')
      }, 4000)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.detail || 'Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return null

  return (
    <Layout>
      <div className="settings-container" style={{ margin: '0', maxWidth: '100%' }}>
        <button onClick={() => navigate('/dashboard')} className="back-link">
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <h1 style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: 800, marginBottom: '24px', color: 'var(--text)' }}>
          Account Settings
        </h1>

        {successMsg && (
          <div className="settings-success-alert">
            <CheckCircle size={16} />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="settings-success-alert" style={{ background: 'rgba(232, 57, 42, 0.08)', borderColor: 'rgba(232, 57, 42, 0.2)', color: 'var(--red)' }}>
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Card 1: User Profile */}
            <div className="settings-card" style={{ margin: 0 }}>
              <div className="settings-card-header">
                <h2 className="settings-card-title">User Profile</h2>
                <p className="settings-card-desc">Personal details and authentication.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <UserIconIconWrapper />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                  <Mail size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-3)' }} />
                  <input 
                    type="email" 
                    value={user.email} 
                    disabled
                    className="form-input"
                    style={{ paddingLeft: '36px', cursor: 'not-allowed' }}
                  />
                  <Lock size={12} style={{ position: 'absolute', right: '12px', color: 'var(--text-3)' }} />
                </div>
              </div>
            </div>

            {/* Card 3: Alert Channels */}
            <div className="settings-card" style={{ margin: 0 }}>
              <div className="settings-card-header">
                <h2 className="settings-card-title">Alert Notifications</h2>
                <p className="settings-card-desc">Set up warning channels to report high-severity threats.</p>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="checkbox-label-container">
                  <input 
                    type="checkbox" 
                    checked={alertEmail} 
                    onChange={(e) => setAlertEmail(e.target.checked)}
                    className="checkbox-input"
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Email Notification Dispatcher</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Receive instant email reports of critical vulnerabilities.</span>
                  </div>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Alert Webhook URL (Optional)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Globe size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-3)' }} />
                  <input 
                    type="url" 
                    placeholder="https://hooks.slack.com/services/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Card 2: Environment Scope */}
            <div className="settings-card" style={{ margin: 0, height: '100%' }}>
              <div className="settings-card-header">
                <h2 className="settings-card-title">Infrastructure Ecosystem</h2>
                <p className="settings-card-desc">Configure your monitored tech stack tags and business industry sector.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Target Industry Sector</label>
                <select 
                  value={industry} 
                  onChange={(e) => setIndustry(e.target.value)}
                  className="form-select"
                  style={{ textTransform: 'capitalize' }}
                >
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="government">Government</option>
                  <option value="manufacturing">Manufacturing</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Monitored Technology Stack</label>
                <div className="tech-input-container">
                  <input 
                    type="text" 
                    placeholder="e.g. React, Docker, nginx, PostgreSQL..."
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    className="form-input"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddTech}
                    className="btn-outline" 
                    style={{ padding: '0 16px', height: '42px', background: 'var(--bg4)', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '6px' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="tech-tags-container">
                  {techStack.length > 0 ? (
                    techStack.map((tech) => (
                      <span key={tech} className="tech-tag-badge">
                        {tech}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTech(tech)}
                          className="remove-tag-btn"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-3)', fontStyle: 'italic', padding: '4px 0' }}>
                      No tech tags added yet. Type tags and click '+' to include monitored tools.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button 
                type="submit" 
                disabled={isSaving}
                className="settings-btn-save"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Save size={14} />
                {isSaving ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </Layout>
  )
}

function UserIconIconWrapper() {
  // Simple wrapper because of icon naming clash
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{ position: 'absolute', left: '12px', color: 'var(--text-3)' }}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
