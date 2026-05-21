import { useState, useEffect } from 'react'
import { Activity, RefreshCw, Cpu, Server, CheckCircle } from 'lucide-react'
import Layout from '../components/common/Layout'
import { useThreatStore } from '../store/threatStore'


export default function Monitor() {
  const addToast = useThreatStore((state) => state.addToast)
  const [scanning, setScanning] = useState(false)
  const [nodes, setNodes] = useState(() => 
    Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      name: `node-${(100 + i).toString(16)}`,
      status: Math.random() > 0.9 ? 'warning' : 'healthy',
      latency: Math.floor(Math.random() * 40) + 10
    }))
  )
  const [logs, setLogs] = useState(() => [
    { time: new Date().toLocaleTimeString(), message: 'Network security monitor initialized.' },
    { time: new Date().toLocaleTimeString(), message: 'Listening on network interface eth0...' },
    { time: new Date().toLocaleTimeString(), message: 'Firewall rules active: 18 blocks/min.' }
  ])


  // Auto scroll logs and randomly update node latencies / append log entries
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly fluctuation latency
      setNodes(prev => prev.map(n => ({
        ...n,
        latency: Math.max(5, n.latency + (Math.random() > 0.5 ? 2 : -2))
      })))

      // Random logs
      if (Math.random() > 0.6) {
        const events = [
          'Scanned incoming port 443 - clean packet signature.',
          'Database backup link verified: status healthy.',
          'TCP connection handshake: API client resolved.',
          'DNS integrity validation completed - verified host records.',
          'Ingress filter processed 124 requests.'
        ]
        const randomEvent = events[Math.floor(Math.random() * events.length)]
        setLogs(prev => [
          ...prev.slice(-15),
          { time: new Date().toLocaleTimeString(), message: randomEvent }
        ])
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleScan = () => {
    if (scanning) return
    setScanning(true)
    addToast('Initializing full network security scan...', 'success')

    // Simulate scan steps
    setTimeout(() => {
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Scanning all 24 connected nodes for active CVE exposures...' }])
    }, 800)

    setTimeout(() => {
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Inspecting SSL certificates and port bindings...' }])
    }, 1800)

    setTimeout(() => {
      setScanning(false)
      // Resolve warning nodes
      setNodes(prev => prev.map(n => ({ ...n, status: 'healthy' })))
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Scan finished. All nodes marked healthy. 0 exposures found.' }])
      addToast('Network security scan completed successfully.', 'success')
    }, 3200)
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              Live Security Monitor
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '13px', margin: '4px 0 0' }}>
              Real-time packet inspection and internal host node exposure scans.
            </p>
          </div>
          
          <button 
            onClick={handleScan} 
            disabled={scanning}
            className="btn btn-primary" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              opacity: scanning ? 0.7 : 1,
              cursor: scanning ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning...' : 'Run Security Scan'}
          </button>
        </div>

        {/* Top Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-2)', fontSize: '12px', fontWeight: 600 }}>
              <Server size={14} /> Nodes Monitored
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', marginTop: '8px' }}>24 / 24</div>
            <div style={{ color: 'var(--green)', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={10} /> 100% Operational status
            </div>
          </div>

          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-2)', fontSize: '12px', fontWeight: 600 }}>
              <Activity size={14} /> Packet Rate
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', marginTop: '8px' }}>148 p/s</div>
            <div style={{ color: 'var(--text-3)', fontSize: '11px', marginTop: '4px' }}>Average latency: 14ms</div>
          </div>

          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-2)', fontSize: '12px', fontWeight: 600 }}>
              <Cpu size={14} /> Firewall Filters
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', marginTop: '8px' }}>Active</div>
            <div style={{ color: 'var(--red)', fontSize: '11px', marginTop: '4px' }}>Blocked 1,208 requests today</div>
          </div>

        </div>

        {/* Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* Node Grid */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Monitored Infrastructure Nodes</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
              {nodes.map(node => (
                <div 
                  key={node.id} 
                  style={{ 
                    border: '1px solid var(--border)', 
                    background: 'var(--bg-3)', 
                    borderRadius: '6px', 
                    padding: '12px', 
                    textAlign: 'center',
                    transition: 'transform 0.15s ease',
                    boxShadow: node.status === 'warning' ? '0 0 10px rgba(232, 140, 42, 0.15)' : 'none',
                    borderColor: node.status === 'warning' ? 'rgba(232, 140, 42, 0.4)' : 'var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                    <div 
                      className={`pulse-dot ${node.status === 'warning' ? 'bg-amber' : 'bg-green'}`} 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: node.status === 'warning' ? 'var(--amber)' : 'var(--green)',
                        boxShadow: `0 0 8px ${node.status === 'warning' ? 'var(--amber)' : 'var(--green)'}`
                      }} 
                    />
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{node.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>{node.latency}ms latency</div>
                </div>
              ))}
            </div>
          </div>

          {/* Console Log Logbook */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Real-time Console Logs</h2>
            
            <div 
              style={{ 
                flex: 1, 
                background: '#040608', 
                border: '1px solid var(--border)', 
                borderRadius: '6px', 
                padding: '12px', 
                fontFamily: 'var(--mono)', 
                fontSize: '11px', 
                color: '#2AE87A',
                overflowY: 'auto',
                minHeight: '260px',
                maxHeight: '360px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {logs.map((log, i) => (
                <div key={i} style={{ lineBreak: 'anywhere' }}>
                  <span style={{ color: 'var(--text-3)' }}>[{log.time}]</span> {log.message}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </Layout>
  )
}
