import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertOctagon,
  Bell,
  CheckCircle,
  ShieldAlert,
  Clock,
  ArrowRight,
  Inbox
} from 'lucide-react'
import { useThreatStore } from '../store/threatStore'
import api from '../services/api'
import Layout from '../components/common/Layout'

// ─── Severity colour map ───────────────────────────────────────────────────
const SEV_STYLE = {
  critical: { color: 'var(--red)',   bg: 'rgba(232,57,42,0.10)',  label: 'Critical' },
  high:     { color: 'var(--amber)', bg: 'rgba(232,140,42,0.10)', label: 'High'     },
  medium:   { color: '#E8C72A',      bg: 'rgba(232,199,42,0.10)', label: 'Medium'   },
  low:      { color: 'var(--green)', bg: 'rgba(42,232,122,0.10)', label: 'Low'      },
}

function getSevStyle(severity) {
  return SEV_STYLE[severity?.toLowerCase()] || SEV_STYLE.low
}

// ─── Relative time helper ─────────────────────────────────────────────────
function relativeTime(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return 'Just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ─── Single alert item component ──────────────────────────────────────────
function AlertItem({ alert, onClick }) {
  const sev   = getSevStyle(alert.threat?.severity)
  const time  = relativeTime(alert.triggered_at)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '14px',
        padding: '16px 20px', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Severity dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: sev.color, flexShrink: 0, marginTop: 6,
        boxShadow: `0 0 6px ${sev.color}`,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{
            fontWeight: 600, fontSize: 13, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {alert.threat?.title || 'Alert'}
          </span>
          <span style={{
            fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-3)',
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Clock size={9} /> {time}
          </span>
        </div>

        {/* Severity + reason row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600,
            color: sev.color, background: sev.bg,
            padding: '2px 8px', borderRadius: 4,
            border: `1px solid ${sev.color}30`,
          }}>
            {sev.label}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
            {alert.reason}
          </span>
        </div>
      </div>

      <ArrowRight size={13} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 4 }} />
    </div>
  )
}

// ─── Main AlertFeed page ───────────────────────────────────────────────────
export default function AlertFeed() {
  const navigate = useNavigate()
  const token    = useThreatStore(s => s.token)
  const user     = useThreatStore(s => s.user)

  const { data, isLoading, error } = useQuery({
    queryKey: ['alertsFeed'],
    queryFn: async () => {
      const res = await api.get('/alerts')
      return res.data?.alerts || []
    },
    enabled: !!token,
    refetchInterval: 30000,
  })

  if (!user) return null

  const alerts = data || []
  const unread = alerts.filter(a => !a.delivered).length

  return (
    <Layout>
      <div style={{ maxWidth: '100%' }}>
        {/* Page header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800,
              color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Bell size={18} style={{ color: 'var(--amber)' }} />
              Alert Feed
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 4, fontFamily: 'var(--mono)' }}>
              {alerts.length} total · {unread} unread
            </p>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/settings')}
          >
            Manage preferences
          </button>
        </div>

        {/* Content panel */}
        <div className="panel" style={{ padding: 0 }}>

          {/* Stats bar */}
          <div style={{
            display: 'flex', gap: 0,
            borderBottom: '1px solid var(--border)',
            padding: '12px 20px',
          }}>
            {[
              { icon: <AlertOctagon size={12} style={{ color: 'var(--red)'   }} />, label: 'Critical', count: alerts.filter(a => a.threat?.severity === 'critical').length },
              { icon: <ShieldAlert  size={12} style={{ color: 'var(--amber)' }} />, label: 'High',     count: alerts.filter(a => a.threat?.severity === 'high').length     },
              { icon: <CheckCircle  size={12} style={{ color: 'var(--green)' }} />, label: 'Resolved', count: alerts.filter(a => a.delivered).length                        },
            ].map(({ icon, label, count }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginRight: 20, fontSize: 12, color: 'var(--text-2)',
              }}>
                {icon}
                <span style={{ fontWeight: 600 }}>{count}</span>
                <span style={{ color: 'var(--text-3)' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Alert list */}
          {isLoading ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Loading alerts…
            </div>

          ) : error ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
              Failed to load alerts. Please refresh.
            </div>

          ) : alerts.length === 0 ? (
            <div style={{ padding: '64px 20px', textAlign: 'center' }}>
              <Inbox size={36} style={{ color: 'var(--text-3)', marginBottom: 12, opacity: 0.5 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                No alerts yet
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
                Alerts are generated when a new threat matches your industry or tech stack.
                Configure your profile in <span
                  style={{ color: 'var(--blue)', cursor: 'pointer' }}
                  onClick={() => navigate('/settings')}
                >Settings</span> to start receiving them.
              </div>
            </div>

          ) : (
            alerts.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onClick={() => navigate(`/threats/${alert.threat?.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
