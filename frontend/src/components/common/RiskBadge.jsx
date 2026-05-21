import { AlertOctagon, AlertTriangle, AlertCircle, Shield } from 'lucide-react'

export default function RiskBadge({ score, severity, showIcon = true }) {
  // Determine severity by score or string
  let level = 'low'
  let label = 'Low'
  const value = typeof score === 'number' ? score : null

  if (value !== null) {
    if (value >= 9.0) {
      level = 'critical'
      label = 'Critical'
    } else if (value >= 7.0) {
      level = 'high'
      label = 'High'
    } else if (value >= 4.0) {
      level = 'medium'
      label = 'Medium'
    } else {
      level = 'low'
      label = 'Low'
    }
  } else if (severity) {
    const sevLower = severity.toLowerCase()
    if (sevLower === 'critical') {
      level = 'critical'
      label = 'Critical'
    } else if (sevLower === 'high') {
      level = 'high'
      label = 'High'
    } else if (sevLower === 'medium') {
      level = 'medium'
      label = 'Medium'
    } else {
      level = 'low'
      label = 'Low'
    }
  }

  // Icons and classes for accessibility
  let Icon
  let styleClass


  switch (level) {
    case 'critical':
      Icon = AlertOctagon
      styleClass = 'sev-critical'
      break
    case 'high':
      Icon = AlertTriangle
      styleClass = 'sev-high'
      break
    case 'medium':
      Icon = AlertCircle
      styleClass = 'sev-medium'
      break
    case 'low':
    default:
      Icon = Shield
      styleClass = 'sev-low'
      break
  }

  return (
    <span 
      className={`severity-badge ${styleClass}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: '600',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '11px',
      }}
      aria-label={`Severity: ${label}`}
    >
      {showIcon && <Icon size={12} style={{ flexShrink: 0 }} />}
      <span>{label}</span>
    </span>
  )
}
