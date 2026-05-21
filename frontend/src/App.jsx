import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ThreatDetail from './pages/ThreatDetail'
import Settings from './pages/Settings'
import AlertFeed from './pages/AlertFeed'
import Monitor from './pages/Monitor'
import CVEExplorer from './pages/CVEExplorer'
import PatchTracker from './pages/PatchTracker'
import Integrations from './pages/Integrations'
import ErrorBoundary from './components/common/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/threats/:id" element={<ThreatDetail />} />
            <Route path="/alerts" element={<AlertFeed />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/monitor" element={<Monitor />} />
            <Route path="/cve-explorer" element={<CVEExplorer />} />
            <Route path="/patch-tracker" element={<PatchTracker />} />
            <Route path="/integrations" element={<Integrations />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App

