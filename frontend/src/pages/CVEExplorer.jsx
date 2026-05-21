import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ArrowLeft, ArrowRight, Database, ShieldAlert } from 'lucide-react'
import api from '../services/api'


import Layout from '../components/common/Layout'
import RiskBadge from '../components/common/RiskBadge'
import { TableSkeleton } from '../components/common/Skeletons'

export default function CVEExplorer() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    document.title = "CVE Explorer | ThreatLens"
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Explore and search the database of CVE vulnerability details, including CVSS scoring and advisories.')
    }
  }, [])

  // Sync API query variables
  const { data, isLoading } = useQuery({
    queryKey: ['cveExplorerFeed', search, source, severity, page],
    queryFn: async () => {
      const params = {
        limit: 15,
        skip: (page - 1) * 15,
      }
      if (search) params.search = search
      if (source !== 'all') params.source = source
      if (severity !== 'all') params.severity = severity

      const res = await api.get('/threats', { params })
      return res.data
    },
    keepPreviousData: true
  })

  const threats = data?.threats || []
  const totalCount = data?.total_count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 15))

  const handleRowClick = (id) => {
    navigate(`/threats/${id}`)
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        
        {/* Header */}
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            CVE Vulnerability Explorer
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', margin: '4px 0 0' }}>
            Browse and query the absolute registry of threat indices and NVD records.
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ 
          background: 'var(--bg-2)', 
          border: '1px solid var(--border)', 
          padding: '16px', 
          borderRadius: '8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex' }}>
              <Search size={14} />
            </span>
            <input 
              type="text" 
              placeholder="Search CVE ID, product, keyword..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input"
              style={{ paddingLeft: '36px', width: '100%', margin: 0 }}
            />
          </div>

          {/* Source filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 }}>Feed Source:</span>
            <select 
              value={source} 
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
              className="form-select"
              style={{ margin: 0, width: '120px' }}
            >
              <option value="all">All Sources</option>
              <option value="nvd">NVD Feed</option>
              <option value="cisa">CISA KEV</option>
            </select>
          </div>

          {/* Severity filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 }}>Severity:</span>
            <select 
              value={severity} 
              onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
              className="form-select"
              style={{ margin: 0, width: '130px' }}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Results count status bar */}
        <div style={{ fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={12} />
          Found {totalCount} matching vulnerability entries in the threat index
        </div>

        {/* Table container */}
        <div className="threat-feed-container" style={{ margin: 0 }}>
          <table className="threat-table">
            <thead>
              <tr>
                <th style={{ width: '140px' }}>Severity</th>
                <th style={{ width: '180px' }}>CVE ID</th>
                <th>Vulnerability Title / Detail</th>
                <th style={{ width: '120px' }}>Source</th>
                <th style={{ width: '150px' }}>Published</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" style={{ padding: 0 }}>
                    <TableSkeleton rows={10} cols={5} />
                  </td>
                </tr>
              ) : threats.length > 0 ? (
                threats.map((threat) => {
                  const score = threat.ai_risk_score !== null ? threat.ai_risk_score : 5.0
                  return (
                    <tr key={threat.id} onClick={() => handleRowClick(threat.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <RiskBadge score={score} showIcon={true} />
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                        {threat.source_id}
                      </td>
                      <td style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-2)' }}>
                        {threat.title || 'Vulnerability details loaded.'}
                      </td>
                      <td style={{ textTransform: 'uppercase', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)' }}>
                        {threat.source}
                      </td>
                      <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>
                        {new Date(threat.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-3)' }}>
                    <ShieldAlert size={32} style={{ color: 'var(--text-3)', marginBottom: '8px', opacity: 0.5 }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>No Vulnerabilities Found</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>Try broadening your search keywords or filter values.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px 20px',
              borderTop: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                Page {page} of {totalPages}
              </span>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', height: 'auto', opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ArrowLeft size={12} /> Prev
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', height: 'auto', opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
