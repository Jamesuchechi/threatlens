
export function StatCardSkeleton() {
  return (
    <div className="stat-card skeleton" style={{ minHeight: '110px', animation: 'none' }}>
      <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '16px' }} />
      <div className="skeleton" style={{ width: '60%', height: '28px', marginBottom: '12px' }} />
      <div className="skeleton" style={{ width: '30%', height: '12px' }} />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div style={{ width: '100%', padding: '10px' }}>
      {[...Array(rows)].map((_, i) => (
        <div 
          key={i} 
          style={{ 
            display: 'flex', 
            gap: '16px', 
            padding: '16px 12px', 
            borderBottom: i < rows - 1 ? '1px solid var(--border)' : 'none',
            alignItems: 'center' 
          }}
        >
          {[...Array(cols)].map((_, j) => {
            // Give columns different widths to look like a real table
            const widths = ['15%', '10%', '40%', '15%', '20%']
            const width = widths[j % widths.length]
            return (
              <div 
                key={j} 
                className="skeleton" 
                style={{ 
                  width, 
                  height: j === 2 ? '14px' : '10px', 
                  borderRadius: '3px' 
                }} 
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function AlertListSkeleton({ count = 4 }) {
  return (
    <div style={{ width: '100%' }}>
      {[...Array(count)].map((_, i) => (
        <div 
          key={i} 
          style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '50%', height: '14px' }} />
            <div className="skeleton" style={{ width: '15%', height: '10px' }} />
          </div>
          <div className="skeleton" style={{ width: '80%', height: '11px' }} />
          <div className="skeleton" style={{ width: '25%', height: '9px', marginTop: '4px' }} />
        </div>
      ))}
    </div>
  )
}

export function ThreatDetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', padding: '20px' }}>
      <div className="skeleton" style={{ width: '150px', height: '14px', marginBottom: '10px' }} />
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Main section skeleton */}
        <div style={{ flex: 2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ border: '1px solid var(--border)', padding: '24px', borderRadius: '8px', background: 'var(--bg-2)' }}>
            <div className="skeleton" style={{ width: '25%', height: '12px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '80%', height: '24px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '40%', height: '10px' }} />
          </div>
          
          <div style={{ border: '1px solid var(--border)', padding: '24px', borderRadius: '8px', background: 'var(--bg-2)' }}>
            <div className="skeleton" style={{ width: '35%', height: '16px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '100%', height: '12px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '95%', height: '12px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '70%', height: '12px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', background: 'var(--bg-2)' }}>
              <div className="skeleton" style={{ width: '50%', height: '14px', marginBottom: '12px' }} />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <div className="skeleton" style={{ width: '60px', height: '20px' }} />
                <div className="skeleton" style={{ width: '80px', height: '20px' }} />
              </div>
            </div>
            <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', background: 'var(--bg-2)' }}>
              <div className="skeleton" style={{ width: '50%', height: '14px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ width: '90%', height: '14px' }} />
            </div>
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ border: '1px solid var(--border)', padding: '24px', borderRadius: '8px', background: 'var(--bg-2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '50%', height: '14px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '60%', height: '14px' }} />
          </div>

          <div style={{ border: '1px solid var(--border)', padding: '24px', borderRadius: '8px', background: 'var(--bg-2)' }}>
            <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '100%', height: '12px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '90%', height: '12px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '100%', height: '32px' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
