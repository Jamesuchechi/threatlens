import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  AlertTriangle,
  ExternalLink,
  Cpu,
  Activity,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react'
import { useThreatStore } from '../store/threatStore'
import api from '../services/api'
import Layout from '../components/common/Layout'
import './ThreatDetail.css'

export default function ThreatDetail() {
  const { id } = useParams()
  const user = useThreatStore((state) => state.user)
  const token = useThreatStore((state) => state.token)
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  // Redirect if not authenticated
  if (!token || !user) {
    navigate('/login')
  }

  // Fetch threat detail query
  const { data: threat, isLoading, error } = useQuery({
    queryKey: ['threat', id],
    queryFn: async () => {
      const res = await api.get(`/threats/${id}`)
      return res.data
    },
    enabled: !!id
  })

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </Layout>
    )
  }

  if (error || !threat) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', paddingTop: '60px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--red)', marginBottom: '20px' }} />
          <h2 style={{ fontFamily: 'var(--display)', marginBottom: '10px', color: 'var(--text)' }}>Threat Intelligence Not Found</h2>
          <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>
            The requested intelligence item could not be retrieved. It may have been archived or deleted.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost">
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </Layout>
    )
  }

  // Determine Severity Styling
  const getSeverityStyle = (score, label) => {
    const finalScore = score !== null ? score : (label === 'critical' ? 9.5 : label === 'high' ? 8.0 : label === 'medium' ? 5.5 : 2.5)
    
    if (finalScore >= 9.0) return { color: '#E8392A', strokeDash: (finalScore / 10) * 339.29, label: 'Critical' }
    if (finalScore >= 7.0) return { color: '#E88C2A', strokeDash: (finalScore / 10) * 339.29, label: 'High' }
    if (finalScore >= 4.0) return { color: '#E8C72A', strokeDash: (finalScore / 10) * 339.29, label: 'Medium' }
    return { color: '#2AE87A', strokeDash: (finalScore / 10) * 339.29, label: 'Low' }
  }

  const sevInfo = getSeverityStyle(threat.cvss_score, threat.severity)

  return (
    <Layout>
      <div className="detail-container" style={{ padding: 0, margin: 0, maxWidth: '100%' }}>
        <button onClick={() => navigate('/dashboard')} className="back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '20px' }}>
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <div className="detail-layout">
          {/* Main Column */}
          <div className="detail-main">
            {/* Header info */}
            <div className="detail-header">
              <div className="detail-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="detail-source-id">{threat.source_id}</span>
                  <button
                    title="Copy CVE ID"
                    onClick={() => {
                      navigator.clipboard.writeText(threat.source_id)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    style={{
                      background: 'none', border: '1px solid var(--border)', borderRadius: '4px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '3px 8px', color: copied ? 'var(--green)' : 'var(--text-3)',
                      fontSize: '10px', fontFamily: 'var(--mono)', transition: 'color 0.2s'
                    }}
                  >
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <span className="source-badge">{threat.source}</span>
                  {threat.is_actively_exploited && (
                    <span className="severity-badge sev-critical">Actively Exploited</span>
                  )}
                </div>
              </div>
              <h2 className="detail-title" style={{ marginTop: '12px' }}>{threat.title}</h2>
              <div className="detail-timestamps" style={{ marginTop: '12px' }}>
                <span>Published: {formatDate(threat.published_at)}</span>
                <span>Ingested: {formatDate(threat.ingested_at)}</span>
              </div>
            </div>

            {/* Description */}
            <div className="detail-section">
              <div className="detail-section-title">Vulnerability Description</div>
              <p className="detail-description">{threat.description}</p>
            </div>

            <div className="detail-grid">
              {/* CPEs (affected products) */}
              <div className="detail-section">
                <div className="detail-section-title">Affected CPE Configurations</div>
                <div className="cpe-list">
                  {threat.affected_products && threat.affected_products.length > 0 ? (
                    threat.affected_products.map((cpe) => (
                      <span key={cpe} className="cpe-item">{cpe}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: '13px' }}>
                      No specific products classified.
                    </span>
                  )}
                </div>
              </div>

              {/* CWEs & Metrics */}
              <div className="detail-section">
                <div className="detail-section-title">Weakness Classification (CWE)</div>
                <div className="cwe-list" style={{ marginBottom: '24px' }}>
                  {threat.cwe_ids && threat.cwe_ids.length > 0 ? (
                    threat.cwe_ids.map((cwe) => (
                      <span key={cwe} className="cwe-item">{cwe}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: '13px' }}>
                      No CWE classifications linked.
                    </span>
                  )}
                </div>

                {threat.cvss_vector && (
                  <>
                    <div className="detail-section-title">CVSS Base Vector</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', wordBreak: 'break-all', color: 'var(--text-2)', background: 'var(--bg3)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      {threat.cvss_vector}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Patch Info */}
            <div className="detail-section">
              <div className="detail-section-title">Remediation & Patch Reference</div>
              {threat.patch_url ? (
                <div className="patch-box">
                  <div className="patch-title">
                    <CheckCircle size={14} />
                    Official Patch/Advisory Available
                  </div>
                  <a href={threat.patch_url} target="_blank" rel="noopener noreferrer" className="patch-link">
                    {threat.patch_url}
                    <ExternalLink size={10} style={{ marginLeft: '4px', display: 'inline' }} />
                  </a>
                </div>
              ) : (
                <div className="patch-box" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                  <div className="patch-title" style={{ color: 'var(--text-3)' }}>
                    <AlertTriangle size={14} />
                    No Direct Patch Link Found
                  </div>
                  <span style={{ fontSize: '13px' }}>Refer to main advisory references for potential mitigation techniques.</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="detail-sidebar">
            {/* CVSS Score Gauge */}
            <div className="score-card">
              <div className="score-label">Base CVSS Score</div>
              <div className="score-circle-wrapper">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle className="score-circle-bg" cx="60" cy="60" r="54" />
                  <circle 
                    className="score-circle-fill" 
                    cx="60" 
                    cy="60" 
                    r="54" 
                    stroke={sevInfo.color}
                    strokeDasharray="339.29"
                    strokeDashoffset={339.29 - sevInfo.strokeDash}
                  />
                </svg>
                <div className="score-value" style={{ color: sevInfo.color }}>
                  {threat.cvss_score !== null ? threat.cvss_score.toFixed(1) : 'N/A'}
                </div>
              </div>
              <div className="score-level" style={{ color: sevInfo.color }}>
                {sevInfo.label} Severity
              </div>
            </div>

            {/* AI Summarization Panel */}
            <div className={`ai-intel-card ${!threat.ai_summary ? 'pending' : ''}`}>
              <div className="ai-header">
                <Cpu size={16} style={{ color: 'var(--red)' }} />
                AI Intelligence
                <span className="ai-badge">GPT Agent</span>
              </div>
              <div className="ai-body">
                {threat.ai_summary ? (
                  <>
                    <p style={{ marginBottom: '16px', fontSize: '13px', lineHeight: '1.6' }}>{threat.ai_summary}</p>
                    
                    {threat.ai_recommendations && threat.ai_recommendations.length > 0 && (
                      <>
                        <div className="score-label" style={{ marginBottom: '8px', textAlign: 'left' }}>Remediation Strategy</div>
                        {threat.ai_recommendations.map((rec, i) => (
                          <div key={i} className="remediation-step">
                            <span className="remediation-number">0{i+1}</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{rec}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="ai-pending-text">
                      AI Ingestion Queue Active.
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5 }}>
                      The AI Ingestion Engine is currently analyzing this threat to synthesize risk score projections and remediation strategies tailored to your stack: 
                      <strong> {user.tech_stack?.join(', ')}</strong>.
                    </p>
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-3)', fontSize: '11px', fontFamily: 'var(--mono)' }}>
                      <Activity size={12} className="spinner" style={{ animationDuration: '2s', borderTopColor: 'var(--text-3)', marginBottom: 0 }} />
                      Status: QUEUED_FOR_SUMMARY
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
