import { useRef, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Shield, 
  Search, 
  RefreshCw, 
  Bell, 
  LayoutDashboard, 
  AlertOctagon, 
  ShieldAlert, 
  Activity, 
  FileSearch, 
  CheckSquare, 
  Cpu, 
  Layers, 
  Settings as SettingsIcon,
  LogOut,
  Sun,
  Moon
} from 'lucide-react'
import { useThreatStore } from '../../store/threatStore'
import api from '../../services/api'
import ToastContainer from './Toast'

export default function Layout({ children, onSearchChange }) {
  const location = useLocation()
  const navigate = useNavigate()
  const searchInputRef = useRef(null)
  
  const user = useThreatStore((state) => state.user)
  const token = useThreatStore((state) => state.token)
  const logout = useThreatStore((state) => state.logout)
  const filters = useThreatStore((state) => state.filters)
  const setFilter = useThreatStore((state) => state.setFilter)

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('threatlens_theme') || 'dark')

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    localStorage.setItem('threatlens_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!token || !user) {
      navigate('/login')
    }
  }, [token, user, navigate])

  // Cmd+K Focus handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch alerts count
  const { data: alertsData } = useQuery({
    queryKey: ['alertsCount'],
    queryFn: async () => {
      const res = await api.get('/alerts')
      return res.data?.alerts || []
    },
    enabled: !!token,
    refetchInterval: 30000 // refetch every 30s
  })

  const alertsCount = alertsData?.length || 0

  // Fetch critical threats count
  const { data: statsData } = useQuery({
    queryKey: ['threatStats'],
    queryFn: async () => {
      const res = await api.get('/threats/stats')
      return res.data
    },
    enabled: !!token
  })

  const criticalCount = statsData?.critical_count || 0

  const getInitials = (name) => {
    if (!name) return 'TL'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setFilter('search', value)
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  const triggerSync = async () => {
    try {
      // Refresh the page data or query cache
      window.location.reload()
    } catch (err) {
      console.error("Failed to sync", err)
    }
  }

  const handleLogoutClick = () => {
    logout()
    navigate('/')
  }

  if (!user) return null

  const userInitials = getInitials(user.name)
  const formattedIndustry = user.industry 
    ? user.industry.charAt(0).toUpperCase() + user.industry.slice(1)
    : 'Admin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <Link to="/dashboard" className="logo">
            <div className="logo-icon">
              <Shield size={14} style={{ color: '#fff' }} />
            </div>
            ThreatLens
          </Link>
        </div>
        
        <div className="topbar-center">
          <div className="search-wrap">
            <span className="search-icon">
              <Search size={14} />
            </span>
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search CVE, keyword, product…" 
              value={filters?.search || ''}
              onChange={handleSearchChange}
            />
          </div>
          <span className="topbar-tag">⌘ K</span>
        </div>

        <div className="topbar-right">
          <button className="topbar-icon-btn" title="Toggle Light/Dark Theme" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          <button className="topbar-icon-btn" title="Refresh/Sync Dashboard" onClick={triggerSync}>
            <RefreshCw size={16} />
          </button>
          
          <button className="topbar-icon-btn" title="Alert Feed" onClick={() => navigate('/alerts')}>
            <Bell size={16} />
            {alertsCount > 0 && <span className="notif-dot"></span>}
          </button>
          
          <div className="divider-v"></div>
          
          <Link to="/settings" className="avatar" title={user.name}>
            {userInitials}
          </Link>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section-label">Intelligence</div>
          
          <Link 
            to="/dashboard" 
            className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
          
          <Link 
            to="/dashboard" 
            className={`nav-item ${location.pathname.startsWith('/threats') ? 'active' : ''}`}
          >
            <ShieldAlert size={15} />
            Threats
            {criticalCount > 0 && <span className="nav-badge">{criticalCount}</span>}
          </Link>
          
          <Link
            to="/alerts"
            className={`nav-item ${location.pathname === '/alerts' ? 'active' : ''}`}
          >
            <AlertOctagon size={15} />
            Alerts
            {alertsCount > 0 && <span className="nav-badge" style={{ background: 'rgba(232,140,42,0.15)', color: 'var(--amber)', border: '1px solid rgba(232,140,42,0.25)' }}>{alertsCount}</span>}
          </Link>

          <Link 
            to="/monitor" 
            className={`nav-item ${location.pathname === '/monitor' ? 'active' : ''}`}
          >
            <Activity size={15} />
            Monitor
            <span className="nav-badge neutral">Beta</span>
          </Link>

          <Link 
            to="/cve-explorer" 
            className={`nav-item ${location.pathname === '/cve-explorer' ? 'active' : ''}`}
          >
            <FileSearch size={15} />
            CVE Explorer
          </Link>

          <div className="sidebar-section-label">My profile</div>

          <Link 
            to="/patch-tracker" 
            className={`nav-item ${location.pathname === '/patch-tracker' ? 'active' : ''}`}
          >
            <CheckSquare size={15} />
            Patch Tracker
          </Link>

          <Link 
            to="/settings" 
            className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            <Layers size={15} />
            My Stack
          </Link>

          <div className="sidebar-section-label">Config</div>
          
          <Link 
            to="/integrations" 
            className={`nav-item ${location.pathname === '/integrations' ? 'active' : ''}`}
          >
            <Cpu size={15} />
            Integrations
          </Link>

          <Link 
            to="/settings" 
            className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            <SettingsIcon size={15} />
            Settings
          </Link>

          {/* Sign Out Button in Sidebar list */}
          <div className="nav-item" onClick={handleLogoutClick} style={{ marginTop: '10px', color: 'rgba(232,57,42,0.7)' }}>
            <LogOut size={15} />
            Sign Out
          </div>

          <div 
            className="sidebar-footer" 
            onClick={() => navigate('/settings')}
            style={{ cursor: 'pointer' }}
          >
            <div className="sidebar-user">
              <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '10px' }}>
                {userInitials}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name" title={user.name}>{user.name}</div>
                <div className="sidebar-user-role" title={`${formattedIndustry} · Admin`}>
                  {formattedIndustry} · Admin
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Container */}
        <main className="main">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
