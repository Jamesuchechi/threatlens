import { useState, useEffect } from 'react'
import { Layers, MessageSquare, Mail, Code, Check } from 'lucide-react'

import Layout from '../components/common/Layout'
import { useThreatStore } from '../store/threatStore'

export default function Integrations() {
  const addToast = useThreatStore((state) => state.addToast)

  // Slack state
  const [slackUrl, setSlackUrl] = useState(() => localStorage.getItem('threatlens_slack_url') || '')
  const [slackEnabled, setSlackEnabled] = useState(() => localStorage.getItem('threatlens_slack_enabled') === 'true')

  // Email state
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('threatlens_email_enabled') === 'true')
  const [emailFreq, setEmailFreq] = useState(() => localStorage.getItem('threatlens_email_freq') || 'daily')

  // Jira state
  const [jiraUrl, setJiraUrl] = useState(() => localStorage.getItem('threatlens_jira_url') || '')
  const [jiraEnabled, setJiraEnabled] = useState(() => localStorage.getItem('threatlens_jira_enabled') === 'true')

  // GitHub sync state
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem('threatlens_github_repo') || '')
  const [githubConnected, setGithubConnected] = useState(() => localStorage.getItem('threatlens_github_connected') === 'true')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    document.title = "Integrations | ThreatLens"
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Configure Slack, Jira, Email, and GitHub repositories to sync and automate your threat notifications.')
    }
  }, [])

  const saveSlack = () => {
    localStorage.setItem('threatlens_slack_url', slackUrl)
    localStorage.setItem('threatlens_slack_enabled', slackEnabled.toString())
    addToast('Slack notification settings updated.', 'success')
  }

  const saveJira = () => {
    localStorage.setItem('threatlens_jira_url', jiraUrl)
    localStorage.setItem('threatlens_jira_enabled', jiraEnabled.toString())
    addToast('Jira project connection details saved.', 'success')
  }

  const handleSlackToggle = () => {
    const val = !slackEnabled
    setSlackEnabled(val)
    localStorage.setItem('threatlens_slack_enabled', val.toString())
    addToast(val ? 'Slack Webhook dispatch active.' : 'Slack dispatch deactivated.', val ? 'success' : 'info')
  }

  const handleJiraToggle = () => {
    const val = !jiraEnabled
    setJiraEnabled(val)
    localStorage.setItem('threatlens_jira_enabled', val.toString())
    addToast(val ? 'Jira issue automation active.' : 'Jira issue automation disabled.', val ? 'success' : 'info')
  }

  const handleEmailToggle = () => {
    const val = !emailAlerts
    setEmailAlerts(val)
    localStorage.setItem('threatlens_email_enabled', val.toString())
    addToast(val ? 'Email security digests active.' : 'Email digests disabled.', val ? 'success' : 'info')
  }

  const handleGithubConnect = (e) => {
    e.preventDefault()
    if (!githubRepo) {
      addToast('Please input a repository identifier first.', 'error')
      return
    }
    setSyncing(true)
    addToast(`Syncing dependencies from GitHub repository ${githubRepo}...`, 'info')
    
    setTimeout(() => {
      setSyncing(false)
      setGithubConnected(true)
      localStorage.setItem('threatlens_github_repo', githubRepo)
      localStorage.setItem('threatlens_github_connected', 'true')
      addToast('GitHub repository connected. Dependencies populated in alert index.', 'success')
    }, 2500)
  }

  const handleGithubDisconnect = () => {
    setGithubConnected(false)
    setGithubRepo('')
    localStorage.removeItem('threatlens_github_repo')
    localStorage.removeItem('threatlens_github_connected')
    addToast('GitHub repository link disconnected.', 'info')
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        
        {/* Header */}
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Platform Integrations
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', margin: '4px 0 0' }}>
            Sync your engineering repositories and distribute threat logs to your team channels.
          </p>
        </div>

        {/* Integration Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* GitHub Sync */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text)', display: 'flex' }}><Code size={20} /></span>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>GitHub Dependency Sync</span>
              </div>
              <span 
                style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  background: githubConnected ? 'rgba(42,232,122,0.15)' : 'var(--bg-4)',
                  color: githubConnected ? 'var(--green)' : 'var(--text-3)',
                  border: githubConnected ? '1px solid rgba(42,232,122,0.25)' : '1px solid var(--border)'
                }}
              >
                {githubConnected ? 'Linked' : 'Not Connected'}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0, lineHeight: 1.4 }}>
              Scan your `package.json` or `requirements.txt` manifest files to automatically detect matching vulnerability items.
            </p>

            {githubConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                <div style={{ 
                  background: 'var(--bg-3)', 
                  border: '1px solid var(--border)', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  fontFamily: 'var(--mono)', 
                  fontSize: '11px',
                  color: 'var(--text-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Check size={12} style={{ color: 'var(--green)' }} /> {githubRepo}
                </div>
                <button 
                  onClick={handleGithubDisconnect}
                  className="btn-outline" 
                  style={{ width: '100%', fontSize: '12px', height: '34px', padding: 0, justifyContent: 'center' }}
                >
                  Disconnect Link
                </button>
              </div>
            ) : (
              <form onSubmit={handleGithubConnect} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                <input 
                  type="text" 
                  placeholder="e.g. facebook/react" 
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  className="form-input"
                  style={{ margin: 0, fontSize: '12px' }}
                  required
                  disabled={syncing}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '12px', height: '34px', padding: 0, justifyContent: 'center' }}
                  disabled={syncing}
                >
                  {syncing ? 'Connecting...' : 'Connect Repository'}
                </button>
              </form>
            )}
          </div>

          {/* Slack Channel alerts */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#E01E5A', display: 'flex' }}><MessageSquare size={20} /></span>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Slack Notifications</span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={slackEnabled} 
                  onChange={handleSlackToggle} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0, lineHeight: 1.4 }}>
              Push live alerts directly to Slack channels when critical exploits are analyzed.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
              <input 
                type="text" 
                placeholder="https://hooks.slack.com/services/..." 
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                className="form-input"
                style={{ margin: 0, fontSize: '12px' }}
                disabled={!slackEnabled}
              />
              <button 
                onClick={saveSlack}
                disabled={!slackEnabled}
                className="btn-outline" 
                style={{ width: '100%', fontSize: '12px', height: '34px', padding: 0, justifyContent: 'center', opacity: slackEnabled ? 1 : 0.5, cursor: slackEnabled ? 'pointer' : 'not-allowed' }}
              >
                Save Slack Hook
              </button>
            </div>
          </div>

          {/* Email Digest */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text)', display: 'flex' }}><Mail size={20} /></span>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Email Digests</span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={emailAlerts} 
                  onChange={handleEmailToggle} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0, lineHeight: 1.4 }}>
              Receive scheduled threat summaries compiling newly indexed CVEs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
              <select 
                value={emailFreq} 
                onChange={(e) => { setEmailFreq(e.target.value); localStorage.setItem('threatlens_email_freq', e.target.value); addToast('Digest frequency saved.', 'success'); }}
                className="form-select"
                style={{ margin: 0, fontSize: '12px', width: '100%' }}
                disabled={!emailAlerts}
              >
                <option value="immediate">Real-time alerts</option>
                <option value="daily">Daily summary</option>
                <option value="weekly">Weekly digest</option>
              </select>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', padding: '8px 0' }}>
                Dispatched to verified profile address.
              </div>
            </div>
          </div>

          {/* Jira Integration */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#0052CC', display: 'flex' }}><Layers size={20} /></span>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Jira Project Boards</span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={jiraEnabled} 
                  onChange={handleJiraToggle} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0, lineHeight: 1.4 }}>
              Auto-create remediation tickets on Jira projects when critical vulnerabilities match.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
              <input 
                type="text" 
                placeholder="e.g. organization.atlassian.net" 
                value={jiraUrl}
                onChange={(e) => setJiraUrl(e.target.value)}
                className="form-input"
                style={{ margin: 0, fontSize: '12px' }}
                disabled={!jiraEnabled}
              />
              <button 
                onClick={saveJira}
                disabled={!jiraEnabled}
                className="btn-outline" 
                style={{ width: '100%', fontSize: '12px', height: '34px', padding: 0, justifyContent: 'center', opacity: jiraEnabled ? 1 : 0.5, cursor: jiraEnabled ? 'pointer' : 'not-allowed' }}
              >
                Save Jira Settings
              </button>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  )
}
