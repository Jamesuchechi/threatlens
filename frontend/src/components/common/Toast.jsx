import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useThreatStore } from '../../store/threatStore'


export default function ToastContainer() {
  const toasts = useThreatStore((state) => state.toasts)
  const removeToast = useThreatStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success'
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '280px',
              maxWidth: '380px',
              padding: '12px 16px',
              background: 'rgba(20, 26, 33, 0.9)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${isSuccess ? 'rgba(42, 232, 122, 0.3)' : 'rgba(232, 57, 42, 0.3)'}`,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 10px ${isSuccess ? 'rgba(42, 232, 122, 0.1)' : 'rgba(232, 57, 42, 0.1)'}`,
              borderRadius: '6px',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: 500,
              animation: 'fadein 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transition: 'all 0.2s ease'
            }}
          >
            {isSuccess ? (
              <CheckCircle2 size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
            )}
            
            <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
            
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                borderRadius: '4px',
                transition: 'color 0.15s, background 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.background = 'var(--bg-4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-3)';
                e.currentTarget.style.background = 'none';
              }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
