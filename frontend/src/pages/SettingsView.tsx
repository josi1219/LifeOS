import { useAuth } from '../auth/AuthContext'
import { LogOut } from 'lucide-react'

export function SettingsView() {
  const { user, logout } = useAuth()

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Manage your Flow account, preferences, and system parameters.
        </p>
      </div>

      <div className="card" style={{ padding: '24px', display: 'grid', gap: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Account Details</div>
        <div style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Email Address</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{user?.email}</div>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Account ID</span>
          <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--color-text-faint)' }}>
            USR-{user?.id}
          </div>
        </div>

        <div style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => logout()}
            style={{ color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)', gap: 8 }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
