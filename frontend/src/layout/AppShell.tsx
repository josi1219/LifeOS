import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Calendar,
  Edit3,
  Eye,
  Flag,
  GitBranch,
  Home,
  LogOut,
  Menu,
  Mountain,
  Search,
  Settings,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useTimer } from '../features/timer/TimerContext'
import { LiveTimerHUD } from '../features/timer/LiveTimerHUD'
import { StopSessionModal } from '../features/timer/StopSessionModal'
import './AppShell.css'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/roadmap', label: 'Roadmap', icon: GitBranch },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/milestones', label: 'Milestones', icon: Flag },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/focus', label: 'Focus', icon: Eye },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/reflections', label: 'Reflections', icon: Edit3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { status } = useTimer()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  // Full-screen distraction-free mode for /focus
  const isFocusMode = location.pathname === '/focus'

  if (isFocusMode) {
    return (
      <div style={{ height: '100vh', background: '#05070a', color: '#f0f2f7', overflow: 'hidden' }}>
        <StopSessionModal />
        {children}
      </div>
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning,'
    if (hour < 18) return 'Good afternoon,'
    return 'Good evening,'
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'K'

  return (
    <div className="flow-shell-root">
      {/* Mobile Backdrop Overlay */}
      <div
        className={`flow-mobile-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sleek Minimalist Obsidian Sidebar */}
      <aside className={`flow-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Flow Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Flow
              </span>
            </div>

            {/* Close button on mobile drawer */}
            <button
              type="button"
              className="flow-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Clean Navigation List */}
          <nav style={{ display: 'grid', gap: 4, marginTop: 'var(--space-2)' }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isHome = item.to === '/'
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={isHome}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                    background: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                  })}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '0 var(--space-2)', display: 'grid', gap: 14 }}>
          <div>
            <div
              style={{
                fontStyle: 'italic',
                fontSize: 11,
                color: 'var(--color-text-muted)',
                lineHeight: 1.4,
              }}
            >
              "Discipline today, freedom tomorrow."
            </div>
            <div style={{ marginTop: 8, color: 'var(--color-text-faint)', display: 'flex', alignItems: 'center' }}>
              <Mountain size={16} />
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 10,
                letterSpacing: '0.04em',
                color: 'var(--color-text-faint)',
              }}
            >
              Focus / Learn / Grow / Repeat
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Top Header Bar */}
        <header className="flow-header">
          {/* Greeting Header & Mobile Toggle */}
          <div className="flow-header-left">
            <button
              type="button"
              className="flow-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flow-header-title">
                {getGreeting()}
              </div>
              <div className="flow-header-subtitle">
                Small steps every day lead to big results.
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Live timer HUD only renders when active session is running */}
            {status !== 'idle' && <LiveTimerHUD />}

            <button
              type="button"
              title="Search"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                padding: 6,
                cursor: 'pointer',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <Search size={18} />
            </button>

            <button
              type="button"
              title="Notifications"
              style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                padding: 6,
                cursor: 'pointer',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <Bell size={18} />
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                }}
              />
            </button>

            {/* Profile Avatar Badge with Menu Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                title={user?.email || 'Account'}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {userInitial}
              </button>

              {isProfileMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 8,
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                    padding: '6px 0',
                    minWidth: 170,
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding: '8px 14px',
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                      borderBottom: '1px solid var(--color-border)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.email || 'User'}
                  </div>
                  <NavLink
                    to="/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      fontSize: 12,
                      color: 'var(--color-text)',
                      textDecoration: 'none',
                    }}
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      logout()
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      background: 'transparent',
                      border: 'none',
                      color: '#f43f5e',
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={14} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Stop Session Modal */}
        <StopSessionModal />

        {/* Scrollable Page Body */}
        <main className="flow-main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
