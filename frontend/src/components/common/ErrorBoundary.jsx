import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: '40px', backgroundColor: 'var(--bg)', color: 'var(--text)',
          fontFamily: 'var(--sans)', textAlign: 'center'
        }}>
          <AlertTriangle size={64} style={{ color: 'var(--red)', marginBottom: '24px' }} />
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '32px', marginBottom: '16px' }}>
            Application Error
          </h1>
          <p style={{ color: 'var(--text-2)', maxWidth: '500px', marginBottom: '32px', lineHeight: '1.6' }}>
            An unexpected error occurred in the ThreatLens interface. The engineering team has been notified.
            Please try reloading the page.
          </p>
          
          <button 
            onClick={() => window.location.reload()}
            className="btn-lg"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} />
            Reload Application
          </button>

          {import.meta.env.DEV && (
            <div style={{ marginTop: '48px', padding: '20px', backgroundColor: 'var(--bg2)', borderRadius: '8px', textAlign: 'left', maxWidth: '800px', overflowX: 'auto' }}>
              <h3 style={{ color: 'var(--red)', marginBottom: '12px', fontSize: '14px' }}>Developer Details:</h3>
              <pre style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                {this.state.error?.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
