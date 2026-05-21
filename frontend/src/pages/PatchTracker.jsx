import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckSquare, Square, CheckCircle, ExternalLink } from 'lucide-react'
import api from '../services/api'

import Layout from '../components/common/Layout'
import RiskBadge from '../components/common/RiskBadge'
import { useThreatStore } from '../store/threatStore'
import { TableSkeleton } from '../components/common/Skeletons'

export default function PatchTracker() {
  const navigate = useNavigate()
  const addToast = useThreatStore((state) => state.addToast)
  
  // Track locally which patches have been marked as resolved/applied
  const [resolvedPatches, setResolvedPatches] = useState(() => {
    const saved = localStorage.getItem('threatlens_resolved_patches')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    document.title = "Patch Tracker | ThreatLens"
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Track, verify, and resolve software patches matching security vulnerabilities in your active stack.')
    }
  }, [])

  // Persist resolved patches
  const saveResolvedPatches = (list) => {
    setResolvedPatches(list)
    localStorage.setItem('threatlens_resolved_patches', JSON.stringify(list))
  }

  // Fetch threats (fetch a larger window to capture enough patches)
  const { data, isLoading } = useQuery({
    queryKey: ['patchTrackerFeed'],
    queryFn: async () => {
      const res = await api.get('/threats', { params: { limit: 100, days: 90 } })
      return res.data?.threats || []
    }
  })

  const threats = data || []
  // Filter for threats that have patches available
  const patchableThreats = threats.filter(t => t.patch_available || t.patch_url)

  const togglePatchResolved = (cveId, e) => {
    e.stopPropagation() // Prevent row click navigation
    if (resolvedPatches.includes(cveId)) {
      const updated = resolvedPatches.filter(id => id !== cveId)
      saveResolvedPatches(updated)
      addToast(`Patch for ${cveId} marked as unresolved.`, 'info')
    } else {
      const updated = [...resolvedPatches, cveId]
      saveResolvedPatches(updated)
      addToast(`Vulnerability ${cveId} successfully marked as resolved!`, 'success')
    }
  }

  const totalPatches = patchableThreats.length
  const appliedCount = patchableThreats.filter(t => resolvedPatches.includes(t.source_id)).length
  const progressPercent = totalPatches > 0 ? Math.round((appliedCount / totalPatches) * 100) : 0

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        
        {/* Header */}
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Remediation & Patch Tracker
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', margin: '4px 0 0' }}>
            Verify available vendor advisories, track applied patches, and secure vulnerability exposures.
          </p>
        </div>

        {/* Progress Card */}
        {totalPatches > 0 && (
          <div style={{ 
            background: 'var(--bg-2)', 
            border: '1px solid var(--border)', 
            padding: '20px', 
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Remediation Progress</div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--red)' }}>
                {appliedCount} / {totalPatches} Patches Applied ({progressPercent}%)
              </div>
            </div>
            
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-4)', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${progressPercent}%`, 
                  height: '100%', 
                  background: 'var(--green)', 
                  transition: 'width 0.4s ease-out',
                  boxShadow: '0 0 8px var(--green)'
                }} 
              />
            </div>
          </div>
        )}

        {/* Patches Table */}
        <div className="threat-feed-container" style={{ margin: 0 }}>
          <table className="threat-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Status</th>
                <th style={{ width: '130px' }}>Severity</th>
                <th style={{ width: '150px' }}>CVE ID</th>
                <th>Vulnerability Title</th>
                <th style={{ width: '120px' }}>Patch Advisory</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" style={{ padding: 0 }}>
                    <TableSkeleton rows={8} cols={5} />
                  </td>
                </tr>
              ) : patchableThreats.length > 0 ? (
                patchableThreats.map((threat) => {
                  const isResolved = resolvedPatches.includes(threat.source_id)
                  const score = threat.ai_risk_score !== null ? threat.ai_risk_score : 5.0
                  
                  return (
                    <tr 
                      key={threat.id} 
                      onClick={() => navigate(`/threats/${threat.id}`)} 
                      style={{ 
                        cursor: 'pointer',
                        opacity: isResolved ? 0.7 : 1
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={(e) => togglePatchResolved(threat.source_id, e)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            color: isResolved ? 'var(--green)' : 'var(--text-3)',
                            padding: '4px',
                            display: 'flex',
                            margin: '0 auto'
                          }}
                          title={isResolved ? "Mark as Unresolved" : "Mark as Resolved"}
                        >
                          {isResolved ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </td>
                      <td>
                        <RiskBadge score={score} showIcon={true} />
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                        {threat.source_id}
                      </td>
                      <td style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-2)' }}>
                        <div style={{ textDecoration: isResolved ? 'line-through' : 'none' }}>
                          {threat.title || 'Vulnerability patch file advisory.'}
                        </div>
                      </td>
                      <td>
                        {threat.patch_url ? (
                          <a 
                            href={threat.patch_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--red)',
                              textDecoration: 'none'
                            }}
                          >
                            Advisory <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-3)' }}>
                    <CheckCircle size={32} style={{ color: 'var(--green)', marginBottom: '8px', opacity: 0.8 }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>All Patches Applied!</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>No pending patch advisories match your organization profile.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </Layout>
  )
}
