import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Search, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Terminal, 
  LogOut,
  Calendar,
  ChevronRight,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { useThreatStore } from '../store/threatStore'
import api from '../services/api'
import './Dashboard.css'

export default function Dashboard() {
  const user = useThreatStore((state) => state.user)
  const token = useThreatStore((state) => state.token)
  const logout = useThreatStore((state) => state.logout)
  
  const filters = useThreatStore((state) => state.filters)
  const setFilter = useThreatStore((state) => state.setFilter)
  const resetFilters = useThreatStore((state) => state.resetFilters)
  
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [scopeOnly, setScopeOnly] = useState(false)
  const [searchVal, setSearchVal] = useState(filters.search)

  // Redirect if not authenticated
  useEffect(() => {
    if (!token || !user) {
      navigate('/login')
    }
  }, [token, user, navigate])

  // Sync search input with Zustand store (debounced or on submit)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setFilter('search', searchVal)
      setPage(1)
    }, 400)
    return () => clearTimeout(delayDebounce)
  }, [searchVal, setFilter])

  // Fetch stats query
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['threatStats'],
    queryFn: async () => {
      const res = await api.get('/threats/stats')
      return res.data
    },
    enabled: !!token
  })

  // Fetch threats query
  const { data: threatsData, isLoading: threatsLoading, refetch: refetchThreats } = useQuery({
    queryKey: ['threats', filters, page],
    queryFn: async () => {
      const params = {
        page,
        limit: 10,
        days: filters.days,
        search: filters.search || undefined,
      }
      if (filters.severity && filters.severity !== 'all') {
        params.severity = filters.severity
      }
      if (filters.source && filters.source !== 'all') {
        params.source = filters.source
      }
      if (filters.exploited !== null) {
        params.exploited = filters.exploited
      }
      const res = await api.get('/threats', { params })
      return res.data
    },
    enabled: !!token
  })

  if (!user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    )
  }

  // Refetch handler
  const handleRefresh = () => {
    refetchStats()
    refetchThreats()
  }

  // Filter lists based on User scope (tech stack / industry)
  const listThreats = threatsData?.threats || []
  const filteredThreats = scopeOnly
    ? listThreats.filter((threat) => {
        const titleMatch = user.tech_stack?.some((tech) => 
          threat.title?.toLowerCase()?.includes(tech.toLowerCase())
        )
        const descMatch = user.tech_stack?.some((tech) => 
          threat.description?.toLowerCase()?.includes(tech.toLowerCase())
        )
        const productMatch = threat.affected_products?.some((prod) => 
          user.tech_stack?.some((tech) => prod?.toLowerCase()?.includes(tech.toLowerCase()))
        )
        return titleMatch || descMatch || productMatch
      })
    : listThreats

  // Text highlighting helper
  const highlightDescription = (text, keywords) => {
    if (!text || !keywords || keywords.length === 0) return text
    
    // Create regex matching any of the tech stack keywords
    const escapedKws = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`\\b(${escapedKws.join('|')})\\b`, 'gi')
    
    const parts = text.split(regex)
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="highlighted-term">{part}</span>
      ) : part
    )
  }

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="dashboard-wrapper">
      {/* Top Navbar */}
      <nav className="dashboard-nav">
        <Link to="/dashboard" className="dashboard-logo">
          <div className="logo-icon">
            <Shield size={16} />
          </div>
          ThreatLens
        </Link>

        <div className="nav-links">
          <Link to="/dashboard" className="nav-link-item active">Dashboard</Link>
          <Link to="/settings" className="nav-link-item">Settings</Link>
          
          <div className="nav-user">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>{user.email}</div>
            </div>
            <button 
              onClick={() => { logout(); navigate('/') }} 
              className="btn-outline" 
              style={{ padding: '6px 12px', fontSize: '11px', height: '32px' }}
            >
              <LogOut size={12} />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="dashboard-container">
        {/* Header section */}
        <div className="dashboard-header">
          <div className="header-title">
            <h1>Threat Command Center</h1>
            <p>Real-time threat intelligence personalized for your environment.</p>
          </div>

          {/* User scope indicator */}
          <div className="ecosystem-panel">
            <div className="ecosystem-section">
              <div className="section-caption">Industry Scope</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{user.industry}</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'var(--border)' }} />
            <div className="ecosystem-section">
              <div className="section-caption">Monitored Technologies</div>
              <div className="tech-badges-list">
                {user.tech_stack && user.tech_stack.length > 0 ? (
                  user.tech_stack.map((tech) => (
                    <span key={tech} className="tech-badge-item">
                      {tech}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-3)', fontStyle: 'italic' }}>None configured</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Ingested Feed</span>
              <Terminal size={14} style={{ color: 'var(--text-2)' }} />
            </div>
            <div className="metric-value">
              {statsLoading ? '...' : stats?.total_last_7_days || 0}
            </div>
            <div className="metric-sub">Total threats tracked last 7d</div>
          </div>

          <div className="metric-card critical">
            <div className="metric-header">
              <span className="metric-label">Critical Alerts</span>
              <AlertTriangle size={14} style={{ color: 'var(--red)' }} />
            </div>
            <div className="metric-value" style={{ color: 'var(--red)' }}>
              {statsLoading ? '...' : stats?.critical_count || 0}
            </div>
            <div className="metric-sub">Active CVSS 9.0+ threats</div>
          </div>

          <div className="metric-card exploited">
            <div className="metric-header">
              <span className="metric-label">Active Exploits</span>
              <AlertTriangle size={14} style={{ color: 'var(--amber)' }} />
            </div>
            <div className="metric-value" style={{ color: 'var(--amber)' }}>
              {statsLoading ? '...' : stats?.actively_exploited_count || 0}
            </div>
            <div className="metric-sub">Verified in CISA KEV catalog</div>
          </div>

          <div className="metric-card average">
            <div className="metric-header">
              <span className="metric-label">Avg Risk Score</span>
              <CheckCircle size={14} style={{ color: 'var(--green)' }} />
            </div>
            <div className="metric-value" style={{ color: 'var(--green)' }}>
              {statsLoading ? '...' : (stats?.avg_risk_score ? stats.avg_risk_score.toFixed(1) : '0.0')}
            </div>
            <div className="metric-sub">Calculated AI threat threat score</div>
          </div>
        </div>

        {/* Trend Area Chart */}
        {stats?.trend && stats.trend.length > 0 && (
          <div className="trend-container">
            <div className="trend-header">
              <div className="trend-title">Daily Ingest Volume (7-Day Trend)</div>
              <button 
                onClick={handleRefresh} 
                className="btn-outline" 
                style={{ padding: '6px 12px', fontSize: '11px', height: '32px', border: '1px solid var(--border)' }}
              >
                <RefreshCw size={12} />
                Sync Feeds
              </button>
            </div>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--red)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--red)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-3)" 
                    style={{ fontSize: '10px', fontFamily: 'var(--mono)' }} 
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis 
                    stroke="var(--text-3)" 
                    style={{ fontSize: '10px', fontFamily: 'var(--mono)' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-3)', 
                      borderColor: 'var(--border)', 
                      borderRadius: '6px', 
                      color: 'var(--text)',
                      fontFamily: 'var(--body)',
                      fontSize: '12px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="var(--red)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Main Feed Layout */}
        <div className="main-layout">
          {/* Side Filter Panel */}
          <div className="sidebar-panel">
            {/* Search filter */}
            <div className="filter-group">
              <div className="filter-title">Search Intel</div>
              <div className="search-input-wrapper">
                <Search size={16} className="search-input-icon" />
                <input 
                  type="text" 
                  placeholder="CVE ID, keyword, IP..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* Ingestion filters */}
            <div className="filter-group">
              <div className="filter-title">Severity Filters</div>
              <div className="filter-list">
                {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => { setFilter('severity', sev); setPage(1); }}
                    className={`filter-button ${filters.severity === sev ? 'active' : ''}`}
                  >
                    <span style={{ textTransform: 'capitalize' }}>{sev}</span>
                    {filters.severity === sev && <ChevronRight size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Source filters */}
            <div className="filter-group">
              <div className="filter-title">Intelligence Source</div>
              <div className="filter-list">
                {['all', 'nvd', 'abuseipdb'].map((src) => (
                  <button
                    key={src}
                    onClick={() => { setFilter('source', src); setPage(1); }}
                    className={`filter-button ${filters.source === src ? 'active' : ''}`}
                  >
                    <span style={{ textTransform: 'uppercase' }}>{src}</span>
                    {filters.source === src && <ChevronRight size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Exploited Status */}
            <div className="filter-group">
              <div className="filter-title">Exploit Status</div>
              <div 
                onClick={() => { 
                  setFilter('exploited', filters.exploited === true ? null : true)
                  setPage(1)
                }}
                className={`toggle-container ${filters.exploited === true ? 'active' : ''}`}
              >
                <span className="toggle-label">Actively Exploited (KEV)</span>
                <div className="toggle-switch" />
              </div>
            </div>

            {/* Scope Match Filter */}
            <div className="filter-group">
              <div className="filter-title">Ecosystem Match</div>
              <div 
                onClick={() => { 
                  setScopeOnly(!scopeOnly)
                  setPage(1)
                }}
                className={`toggle-container ${scopeOnly ? 'active' : ''}`}
              >
                <span className="toggle-label">Monitored Stack Only</span>
                <div className="toggle-switch" />
              </div>
            </div>
            
            {/* Reset Filters */}
            <button 
              onClick={() => { resetFilters(); setScopeOnly(false); setSearchVal(''); setPage(1); }}
              className="btn-outline" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Reset Filters
            </button>
          </div>

          {/* Right Feed Panel */}
          <div className="feed-panel">
            <div className="feed-header">
              <div className="feed-summary">
                {threatsLoading ? (
                  'Scanning threat database...'
                ) : (
                  <>Showing <strong>{filteredThreats.length}</strong> matching threats on this page</>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>
                  <Info size={12} />
                  Click a card to see AI remediation advice
                </span>
              </div>
            </div>

            {threatsLoading ? (
              <div className="loading-container">
                <div className="spinner" />
                <span style={{ color: 'var(--text-2)', fontSize: '14px' }}>Loading Intel Feeds...</span>
              </div>
            ) : filteredThreats.length > 0 ? (
              filteredThreats.map((threat) => (
                <div 
                  key={threat.id} 
                  onClick={() => navigate(`/threats/${threat.id}`)}
                  className={`threat-card ${threat.severity === 'critical' ? 'critical-severity' : ''}`}
                >
                  <div className="threat-card-top">
                    <span className="threat-card-id">{threat.source_id}</span>
                    <div className="threat-card-badges">
                      <span className="source-badge">{threat.source}</span>
                      {threat.is_actively_exploited && (
                        <span className="severity-badge sev-critical" style={{ background: 'rgba(232,57,42,0.1)', color: 'var(--red)', fontSize: '8px' }}>
                          Active Exploit
                        </span>
                      )}
                      {threat.cvss_score !== null ? (
                        <span className={`severity-badge ${
                          threat.cvss_score >= 9.0 ? 'sev-critical' :
                          threat.cvss_score >= 7.0 ? 'sev-high' :
                          threat.cvss_score >= 4.0 ? 'sev-medium' : 'sev-low'
                        }`}>
                          CVSS {threat.cvss_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className={`severity-badge ${
                          threat.severity === 'critical' ? 'sev-critical' :
                          threat.severity === 'high' ? 'sev-high' :
                          threat.severity === 'medium' ? 'sev-medium' : 'sev-low'
                        }`}>
                          {threat.severity}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="threat-card-title">{threat.title}</div>
                  
                  <div className="threat-card-description">
                    {highlightDescription(threat.description, user.tech_stack)}
                  </div>

                  <div className="threat-card-footer">
                    <div className="threat-card-date">
                      <Calendar size={12} />
                      Published: {formatDate(threat.published_at)}
                    </div>
                    <span className="threat-detail-link">
                      Remediation Intel
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-feed">
                <div className="empty-icon">
                  <Filter size={20} />
                </div>
                <h3>No Intelligence Found</h3>
                <p>Try broadening your filter criteria, resetting stack scope, or refining your search term.</p>
              </div>
            )}

            {/* Pagination Controls */}
            {threatsData && threatsData.total > 0 && (
              <div className="pagination-container">
                <button 
                  onClick={() => setPage((p) => Math.max(p - 1, 1))} 
                  disabled={page === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <div className="pagination-info">
                  Page {page} of {Math.ceil((threatsData.total || 0) / 10)} (Total: {threatsData.total})
                </div>
                <button 
                  onClick={() => setPage((p) => p + 1)} 
                  disabled={page >= Math.ceil((threatsData.total || 0) / 10)}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
