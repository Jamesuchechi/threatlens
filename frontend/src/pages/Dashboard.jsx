import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Shield, 
  RefreshCw, 
  AlertOctagon, 
  ShieldAlert, 
  Activity, 
  CheckSquare, 
  Layers, 
  FileText,
  Database,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts'
import { useThreatStore } from '../store/threatStore'
import api from '../services/api'
import Layout from '../components/common/Layout'
import './Dashboard.css'

// Donut Chart Component using inline SVG and percentages
function DonutChart({ critical, high, medium, low }) {
  const total = critical + high + medium + low || 1
  const pCrit = (critical / total) * 100
  const pHigh = (high / total) * 100
  const pMed = (medium / total) * 100
  const pLow = (low / total) * 100

  const r = 24
  const c = 2 * Math.PI * r // ~150.8

  const strokeCrit = (pCrit / 100) * c
  const strokeHigh = (pHigh / 100) * c
  const strokeMed = (pMed / 100) * c
  const strokeLow = (pLow / 100) * c

  let offset = 0
  const critOffset = c - offset
  offset += strokeCrit
  const highOffset = c - offset
  offset += strokeHigh
  const medOffset = c - offset
  offset += strokeMed
  const lowOffset = c - offset

  return (
    <div className="donut-wrap" style={{ paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        {/* Background circle */}
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--bg4)" strokeWidth="6" />
        
        {/* Segments */}
        {pLow > 0 && <circle cx="36" cy="36" r={r} fill="none" stroke="var(--green)" strokeWidth="6" strokeDasharray={`${strokeLow} ${c}`} strokeDashoffset={lowOffset} />}
        {pMed > 0 && <circle cx="36" cy="36" r={r} fill="none" stroke="#E8C72A" strokeWidth="6" strokeDasharray={`${strokeMed} ${c}`} strokeDashoffset={medOffset} />}
        {pHigh > 0 && <circle cx="36" cy="36" r={r} fill="none" stroke="var(--amber)" strokeWidth="6" strokeDasharray={`${strokeHigh} ${c}`} strokeDashoffset={highOffset} />}
        {pCrit > 0 && <circle cx="36" cy="36" r={r} fill="none" stroke="var(--red)" strokeWidth="6" strokeDasharray={`${strokeCrit} ${c}`} strokeDashoffset={critOffset} />}
      </svg>
      <div className="donut-legend" style={{ flex: 1 }}>
        <div className="donut-legend-item">
          <div className="donut-legend-dot" style={{ background: 'var(--red)' }} />
          Critical ({critical})
        </div>
        <div className="donut-legend-item">
          <div className="donut-legend-dot" style={{ background: 'var(--amber)' }} />
          High ({high})
        </div>
        <div className="donut-legend-item">
          <div className="donut-legend-dot" style={{ background: '#E8C72A' }} />
          Medium ({medium})
        </div>
        <div className="donut-legend-item">
          <div className="donut-legend-dot" style={{ background: 'var(--green)' }} />
          Low ({low})
        </div>
      </div>
    </div>
  )
}

// Sort indicator icon — standalone component so it is not re-created on every render
function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col)
    return <ChevronsUpDown size={11} style={{ opacity: 0.35, marginLeft: 4, flexShrink: 0 }} />
  return sortDir === 'desc'
    ? <ChevronDown size={11} style={{ color: 'var(--blue)', marginLeft: 4, flexShrink: 0 }} />
    : <ChevronUp   size={11} style={{ color: 'var(--blue)', marginLeft: 4, flexShrink: 0 }} />
}

export default function Dashboard() {
  const user = useThreatStore((state) => state.user)
  const token = useThreatStore((state) => state.token)
  
  const filters = useThreatStore((state) => state.filters)
  const setFilter = useThreatStore((state) => state.setFilter)
  
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'critical', 'exploited', 'nopatch'
  const [activeIndustry, setActiveIndustry] = useState('') // Local or global toggle for industry relevance panel
  const [sortKey, setSortKey] = useState('ai_risk_score')   // active sort column
  const [sortDir, setSortDir] = useState('desc')            // 'asc' | 'desc'

  // Sync tab status with Zustand filters
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(1)
    
    if (tab === 'all') {
      setFilter('severity', 'all')
      setFilter('exploited', null)
      setFilter('patch_available', null)
    } else if (tab === 'critical') {
      setFilter('severity', 'critical')
      setFilter('exploited', null)
      setFilter('patch_available', null)
    } else if (tab === 'exploited') {
      setFilter('severity', 'all')
      setFilter('exploited', true)
      setFilter('patch_available', null)
    } else if (tab === 'nopatch') {
      setFilter('severity', 'all')
      setFilter('exploited', null)
      // The API doesn't support patch filter, but we filter client-side or map it
      setFilter('severity', 'all')
    }
  }

  // Column sort handler — toggles direction on same key, resets to desc on new key
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

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
      if (filters.industry) {
        params.industry = filters.industry
      }
      if (filters.exploited !== null) {
        params.exploited = filters.exploited
      }
      const res = await api.get('/threats', { params })
      return res.data
    },
    enabled: !!token
  })

  // Fetch alerts query for sidebar panel
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['alertsFeed'],
    queryFn: async () => {
      const res = await api.get('/alerts')
      return res.data?.alerts || []
    },
    enabled: !!token
  })

  // Text highlighting helper for description and reason matching user tech stack
  const highlightDescription = (text, keywords) => {
    if (!text || !keywords || keywords.length === 0) return text
    const escapedKws = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`\\b(${escapedKws.join('|')})\\b`, 'gi')
    
    const parts = text.split(regex)
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="highlighted-term">{part}</span>
      ) : part
    )
  }

  // Highlight matches in alert reasons
  const highlightMarkup = (text, keywords) => {
    if (!text || !keywords || keywords.length === 0) return text
    const escapedKws = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`\\b(${escapedKws.join('|')})\\b`, 'gi')
    
    const parts = text.split(regex)
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i}>{part}</mark>
      ) : part
    )
  }

  // Format date relative or short format
  const formatPublishedTime = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    const diffMs = new Date() - d
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 24) {
      if (diffHours === 0) return 'Just now'
      return `${diffHours}h ago`
    }
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const handleIndustryClick = (ind) => {
    if (activeIndustry === ind) {
      setActiveIndustry('')
      setFilter('industry', null)
    } else {
      setActiveIndustry(ind)
      setFilter('industry', ind)
    }
    setPage(1)
  }

  const exportReport = () => {
    alert("Exporting PDF intelligence report...")
  }

  const syncFeeds = () => {
    refetchStats()
    refetchThreats()
  }

  if (!user) return null

  const threats = threatsData?.threats || []
  const totalThreats = threatsData?.total || 0

  // Filter client side only for 'nopatch' tab
  const filteredThreats = activeTab === 'nopatch'
    ? threats.filter(t => !t.patch_available)
    : threats

  // Client-side column sort applied on top of API result
  const sortedThreats = [...filteredThreats].sort((a, b) => {
    let aVal, bVal
    switch (sortKey) {
      case 'ai_risk_score':
        aVal = a.ai_risk_score ?? -1
        bVal = b.ai_risk_score ?? -1
        break
      case 'title':
        aVal = (a.title || '').toLowerCase()
        bVal = (b.title || '').toLowerCase()
        break
      case 'source':
        aVal = (a.source || '').toLowerCase()
        bVal = (b.source || '').toLowerCase()
        break
      case 'published_at':
        aVal = a.published_at ? new Date(a.published_at).getTime() : 0
        bVal = b.published_at ? new Date(b.published_at).getTime() : 0
        break
      case 'patch_available':
        // true (patch exists) sorts after false (no patch) in desc
        aVal = a.patch_available ? 1 : 0
        bVal = b.patch_available ? 1 : 0
        break
      case 'is_actively_exploited':
        aVal = a.is_actively_exploited ? 1 : 0
        bVal = b.is_actively_exploited ? 1 : 0
        break
      default:
        return 0
    }
    if (aVal < bVal) return sortDir === 'desc' ? 1 : -1
    if (aVal > bVal) return sortDir === 'desc' ? -1 : 1
    return 0
  })

  // Sparkline data generation for data sources
  const mockSparklineData = [12, 19, 3, 5, 2, 3, 20]

  return (
    <Layout>
      <div className="dashboard-container">
        
        {/* ── PAGE HEADER ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <div className="page-sub">
              <span className="pulse-dot"></span>
              Last synced 2 minutes ago · {totalThreats} threats indexed today
            </div>
          </div>
          <div className="page-actions">
            <button className="btn btn-ghost" onClick={exportReport}>
              <FileText size={13} />
              Export
            </button>
            <span className="topbar-tag" style={{ borderStyle: 'dashed' }}>Last 7 days</span>
            <button className="btn btn-primary" onClick={syncFeeds}>
              <RefreshCw size={13} />
              Sync feeds
            </button>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="stat-grid">
          <div className="stat-card red">
            <div className="stat-label">
              <ShieldAlert size={12} />
              Critical threats
            </div>
            <div className="stat-value">{statsLoading ? '...' : stats?.critical_count || 0}</div>
            <div className="stat-delta">
              <span className="delta-up">+4</span>
              <span className="delta-note">vs last week</span>
            </div>
          </div>

          <div className="stat-card amber">
            <div className="stat-label">
              <SlidersHorizontal size={12} />
              High severity
            </div>
            <div className="stat-value">{statsLoading ? '...' : stats?.high_count || 0}</div>
            <div className="stat-delta">
              <span className="delta-up">+11</span>
              <span className="delta-note">vs last week</span>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-label">
              <Activity size={12} />
              Exploited (CISA)
            </div>
            <div className="stat-value">{statsLoading ? '...' : stats?.actively_exploited_count || 0}</div>
            <div className="stat-delta">
              <span className="delta-down">-2</span>
              <span className="delta-note">vs last week</span>
            </div>
          </div>

          <div className="stat-card blue">
            <div className="stat-label">
              <Database size={12} />
              Total indexed
            </div>
            <div className="stat-value">{statsLoading ? '...' : stats?.total_last_7_days || 0}</div>
            <div className="stat-delta">
              <span className="delta-up">+63</span>
              <span className="delta-note">vs last week</span>
            </div>
          </div>
        </div>

        {/* ── TWO-COLUMN GRID ── */}
        <div className="two-col">
          {/* Trend Chart Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <Activity size={13} />
                Threat volume - last 7 days
              </div>
            </div>
            <div className="chart-area" style={{ height: '220px', padding: '20px' }}>
              {stats?.trend && stats.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--red)" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="var(--red)" stopOpacity={0.25} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--text-3)" 
                      style={{ fontSize: '9px', fontFamily: 'var(--mono)' }} 
                      tickFormatter={(val) => {
                        const parts = val.split('-')
                        return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : val
                      }}
                    />
                    <YAxis 
                      stroke="var(--text-3)" 
                      style={{ fontSize: '9px', fontFamily: 'var(--mono)' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ 
                        backgroundColor: 'var(--bg3)', 
                        borderColor: 'var(--border)', 
                        borderRadius: '6px', 
                        color: 'var(--text)',
                        fontFamily: 'var(--body)',
                        fontSize: '11px'
                      }} 
                    />
                    <Bar dataKey="count" fill="url(#barGrad)" radius={[2, 2, 0, 0]} barSize={32}>
                      {stats.trend.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === stats.trend.length - 1 ? 'var(--red)' : 'url(#barGrad)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                  No trend data available
                </div>
              )}
            </div>
          </div>

          {/* User Alerts panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <AlertOctagon size={13} style={{ color: 'var(--amber)' }} />
                My alerts
              </div>
            </div>
            <div className="alerts-list" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {alertsLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                  Loading alerts...
                </div>
              ) : alertsData && alertsData.length > 0 ? (
                alertsData.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="alert-item" onClick={() => navigate(`/threats/${alert.threat?.id}`)}>
                    <div className="alert-item-top">
                      <div className="alert-title">{alert.threat?.title || 'Triggered Alert'}</div>
                      <div className="alert-time">{formatPublishedTime(alert.triggered_at)}</div>
                    </div>
                    <div className="alert-reason">
                      {highlightMarkup(alert.reason, user.tech_stack)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
                  <CheckSquare size={20} style={{ color: 'var(--green)', marginBottom: '8px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 500 }}>No Alerts Triggered</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>Your tech stack is currently secure.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── THREE-COLUMN GRID ── */}
        <div className="three-col">
          {/* Severity Breakdown */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <SlidersHorizontal size={13} />
                Severity breakdown
              </div>
            </div>
            <div style={{ padding: '10px 0' }}>
              <div className="risk-row">
                <span className="risk-row-label" style={{ color: 'var(--red)' }}>Critical</span>
                <div className="risk-track">
                  <div className="risk-fill" style={{ background: 'var(--red)', width: `${stats ? (stats.critical_count / (stats.total_last_7_days || 1)) * 100 : 0}%` }}></div>
                </div>
                <span className="risk-count">{stats?.critical_count || 0}</span>
              </div>
              <div className="risk-row">
                <span className="risk-row-label" style={{ color: 'var(--amber)' }}>High</span>
                <div className="risk-track">
                  <div className="risk-fill" style={{ background: 'var(--amber)', width: `${stats ? (stats.high_count / (stats.total_last_7_days || 1)) * 100 : 0}%` }}></div>
                </div>
                <span className="risk-count">{stats?.high_count || 0}</span>
              </div>
              <div className="risk-row">
                <span className="risk-row-label" style={{ color: '#E8C72A' }}>Medium</span>
                <div className="risk-track">
                  <div className="risk-fill" style={{ background: '#E8C72A', width: `${stats ? (stats.medium_count / (stats.total_last_7_days || 1)) * 100 : 0}%` }}></div>
                </div>
                <span className="risk-count">{stats?.medium_count || 0}</span>
              </div>
              <div className="risk-row">
                <span className="risk-row-label" style={{ color: 'var(--green)' }}>Low</span>
                <div className="risk-track">
                  <div className="risk-fill" style={{ background: 'var(--green)', width: `${stats ? (stats.low_count / (stats.total_last_7_days || 1)) * 100 : 0}%` }}></div>
                </div>
                <span className="risk-count">{stats?.low_count || 0}</span>
              </div>
            </div>
            
            <DonutChart 
              critical={stats?.critical_count || 0}
              high={stats?.high_count || 0}
              medium={stats?.medium_count || 0}
              low={stats?.low_count || 0}
            />
          </div>

          {/* Industry Relevance */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <Layers size={13} />
                Industry relevance
              </div>
            </div>
            <div className="industry-tags" style={{ flex: 1 }}>
              {["healthcare", "finance", "retail", "education", "manufacturing", "technology"].map((ind) => (
                <div 
                  key={ind} 
                  className={`industry-tag ${filters.industry === ind ? 'active-industry' : ''}`}
                  onClick={() => handleIndustryClick(ind)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {ind}
                </div>
              ))}
            </div>
            
            <div className="sparkline-wrap" style={{ borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-2)' }}>
                {filters.industry ? `${filters.industry.toUpperCase()} TREND` : 'GLOBAL ACTIVITY TREND'}
              </div>
              <div className="mini-spark">
                {mockSparklineData.map((val, i) => (
                  <div 
                    key={i} 
                    className="spark-bar" 
                    style={{ 
                      height: `${(val / 20) * 100}%`, 
                      background: filters.industry ? 'var(--blue)' : 'var(--text-3)',
                      width: '6px'
                    }} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <Database size={13} />
                Data sources
              </div>
            </div>
            <div className="table-wrap">
              <table className="threat-table" style={{ fontSize: '11px' }}>
                <tbody>
                  <tr onClick={() => setFilter('source', 'nvd')}>
                    <td style={{ width: '12px', paddingRight: 0 }}>
                      <span className="source-dot src-nvd"></span>
                    </td>
                    <td style={{ fontWeight: 500 }}>NVD / NIST</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-3)', textAlign: 'right' }}>
                      {stats?.total_last_7_days || 0}
                    </td>
                  </tr>
                  <tr onClick={() => { setFilter('exploited', true); setFilter('severity', 'all') }}>
                    <td style={{ width: '12px', paddingRight: 0 }}>
                      <span className="source-dot src-cisa"></span>
                    </td>
                    <td style={{ fontWeight: 500 }}>CISA KEV</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-3)', textAlign: 'right' }}>
                      {stats?.actively_exploited_count || 0}
                    </td>
                  </tr>
                  <tr onClick={() => setFilter('source', 'abuseipdb')}>
                    <td style={{ width: '12px', paddingRight: 0 }}>
                      <span className="source-dot src-abuse"></span>
                    </td>
                    <td style={{ fontWeight: 500 }}>AbuseIPDB</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-3)', textAlign: 'right' }}>
                      {stats ? Math.max(0, stats.total_last_7_days - stats.critical_count) : 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── LIVE THREAT FEED PANEL ── */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Shield size={13} style={{ color: 'var(--red)' }} />
              Live threat feed
            </div>
            <div className="panel-actions">
              <div 
                className={`filter-pill ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => handleTabChange('all')}
              >
                All
              </div>
              <div 
                className={`filter-pill ${activeTab === 'critical' ? 'active active-red' : ''}`}
                onClick={() => handleTabChange('critical')}
              >
                Critical
              </div>
              <div 
                className={`filter-pill ${activeTab === 'exploited' ? 'active' : ''}`}
                onClick={() => handleTabChange('exploited')}
              >
                Exploited
              </div>
              <div 
                className={`filter-pill ${activeTab === 'nopatch' ? 'active' : ''}`}
                onClick={() => handleTabChange('nopatch')}
              >
                No patch
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="threat-table">
              <thead>
                <tr>
                  <th
                    style={{ width: '90px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('ai_risk_score')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      Severity <SortIcon col="ai_risk_score" sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                  <th
                    style={{ width: '80px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('ai_risk_score')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      Risk Score <SortIcon col="ai_risk_score" sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('title')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      Vulnerability Title <SortIcon col="title" sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                  <th
                    style={{ width: '100px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('source')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      Source <SortIcon col="source" sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                  <th
                    style={{ width: '90px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('published_at')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      Published <SortIcon col="published_at" sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                  <th
                    style={{ width: '80px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('patch_available')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      Patch <SortIcon col="patch_available" sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                  <th
                    style={{ width: '100px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('is_actively_exploited')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      Status <SortIcon col="is_actively_exploited" sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {threatsLoading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                      Scanning threat feed...
                    </td>
                  </tr>
                ) : sortedThreats.length > 0 ? (
                  sortedThreats.map((threat) => {
                    const score = threat.ai_risk_score !== null ? threat.ai_risk_score : 5.0
                    const sevClass = 
                      score >= 9.0 ? 'sev-critical' :
                      score >= 7.0 ? 'sev-high' :
                      score >= 4.0 ? 'sev-medium' : 'sev-low'

                    const fillWidth = `${score * 10}%`
                    const fillBg = 
                      score >= 9.0 ? 'var(--red)' :
                      score >= 7.0 ? 'var(--amber)' :
                      score >= 4.0 ? '#E8C72A' : 'var(--green)'

                    return (
                      <tr key={threat.id} onClick={() => navigate(`/threats/${threat.id}`)}>
                        <td>
                          <span className={`sev ${sevClass}`}>
                            {score >= 9.0 ? 'Critical' : score >= 7.0 ? 'High' : score >= 4.0 ? 'Medium' : 'Low'}
                          </span>
                        </td>
                        <td>
                          <div className="score-cell">
                            <div className="score-bar-track">
                              <div className="score-bar-fill" style={{ width: fillWidth, background: fillBg }} />
                            </div>
                            <span className="score-num" style={{ color: fillBg }}>{score.toFixed(1)}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 500, fontSize: '13px' }}>
                          <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)', marginRight: '8px' }}>
                            {threat.source_id}
                          </span>
                          <span style={{ color: 'var(--text)' }}>
                            {highlightDescription(threat.title || 'Vulnerability Classified', user.tech_stack)}
                          </span>
                        </td>
                        <td style={{ textTransform: 'uppercase', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-2)' }}>
                          {threat.source}
                        </td>
                        <td style={{ color: 'var(--text-2)' }}>
                          {formatPublishedTime(threat.published_at)}
                        </td>
                        <td>
                          <span className={`patch-tag ${threat.patch_available ? 'patch-yes' : 'patch-no'}`}>
                            {threat.patch_available ? 'Available' : 'None'}
                          </span>
                        </td>
                        <td>
                          {threat.is_actively_exploited ? (
                            <span className="exploit-tag">
                              <span className="exploit-dot"></span>
                              Exploited
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '10px' }}>Stable</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                      No matching threats found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {threatsData && threatsData.total > 0 && (
            <div className="pagination-container">
              <span className="pagination-info">
                Showing <strong>{sortedThreats.length}</strong> of <strong>{threatsData.total}</strong> threats
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(threatsData.total / 10)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
