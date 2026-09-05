import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  CheckSquare,
  Compass,
  Crosshair,
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Map,
  Milestone as MilestoneIcon,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

interface NavGroup {
  pillar: string
  items: { to: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    pillar: 'FOCUS',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/departments', label: 'Departments', icon: Compass },
    ],
  },
  {
    pillar: 'PLAN',
    items: [
      { to: '/experiments', label: 'Experiments', icon: FlaskConical },
      { to: '/resources', label: 'Knowledge Base', icon: BookOpen },
    ],
  },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  // Derive simple breadcrumb or title
  const getPageTitle = () => {
    if (location.pathname === '/') return 'Mission Control'
    if (location.pathname.startsWith('/departments/')) return 'Department Workspace'
    if (location.pathname === '/departments') return 'Departments'
    if (location.pathname === '/experiments') return 'Research & Experiments'
    if (location.pathname === '/resources') return 'Knowledge & Resources'
    return 'LifeOS'
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sleek Dark Sidebar */}
      <aside
        style={{
          width: 250,
          background: 'var(--color-bg-alt)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-3)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 var(--space-2)' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px var(--color-accent-glow)',
              }}
            >
              <Sparkles size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                LifeOS
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-faint)', fontWeight: 500 }}>
                Organized. On purpose.
              </div>
            </div>
          </div>

          {/* Navigation Pillars */}
          <nav style={{ display: 'grid', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            {NAV_GROUPS.map((group) => (
              <div key={group.pillar}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--color-text-faint)',
                    padding: '0 var(--space-2)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  {group.pillar}
                </div>
                <div style={{ display: 'grid', gap: 2 }}>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px var(--space-2)',
                          borderRadius: 'var(--radius-sm)',
                          textDecoration: 'none',
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                          background: isActive
                            ? 'linear-gradient(90deg, var(--color-accent-subtle) 0%, transparent 100%)'
                            : 'transparent',
                          borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                          transition: 'all 0.15s ease',
                        })}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile & Logout Bottom Section */}
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-accent-text)',
                flexShrink: 0,
              }}
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
              <div style={{ color: 'var(--color-text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email?.split('@')[0]}
              </div>
              <div style={{ color: 'var(--color-text-faint)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            title="Log out"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 6,
              color: 'var(--color-text-faint)',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area with Frosted Top Header */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <header
          style={{
            height: 56,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 var(--space-5)',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(9, 10, 16, 0.75)',
            backdropFilter: 'blur(12px)',
            zIndex: 5,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>
              {getPageTitle()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                fontSize: 12,
                color: 'var(--color-text-muted)',
              }}
            >
              <Crosshair size={13} color="var(--color-accent-text)" />
              <span>LifeOS 2.0 Active</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-5)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
