import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Crosshair,
  Flame,
  Milestone as MilestoneIcon,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { api } from '../api/client'
import type { DashboardOverview, Milestone } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { FocusEditor } from '../features/focus/FocusEditor'

function CircularProgress({ percent, size = 80 }: { percent: number; size?: number }) {
  const strokeWidth = 7
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C5CFC" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: size > 70 ? 15 : 12, fontWeight: 800, color: '#ffffff' }}>
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  )
}

function InlineTimerWidget({ onStart }: { onStart: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, secondsLeft])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const progressPercent = ((25 * 60 - secondsLeft) / (25 * 60)) * 100

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-faint)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
        Focus Timer
      </div>

      <div style={{ margin: 'var(--space-2) 0', position: 'relative' }}>
        <CircularProgress percent={progressPercent || 100} size={110} />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="font-mono" style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {timeFormatted}
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>POMODORO</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
        <button
          className="primary"
          onClick={() => setIsRunning(!isRunning)}
          style={{ fontSize: 12, padding: '6px 14px' }}
        >
          {isRunning ? 'Pause' : 'Start Focus'}
        </button>
        <button
          onClick={() => {
            setIsRunning(false)
            setSecondsLeft(25 * 60)
          }}
          style={{ fontSize: 12, padding: '6px 10px' }}
          title="Reset"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [editingFocus, setEditingFocus] = useState(false)
  const [upcomingMilestones, setUpcomingMilestones] = useState<Milestone[]>([])

  async function load() {
    const data = await api.get<DashboardOverview>('/dashboard/overview')
    setOverview(data)
    if (data.focus.department) {
      try {
        const msList = await api.get<Milestone[]>(`/departments/${data.focus.department.id}/milestones`)
        setUpcomingMilestones(msList.slice(0, 3))
      } catch {
        setUpcomingMilestones([])
      }
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function clearOverride() {
    await api.delete('/focus/override')
    await load()
  }

  if (!overview) return <div className="card">Loading mission control...</div>

  const { focus, active_departments, recent_activity } = overview
  const userName = user?.email ? user.email.split('@')[0] : 'Explorer'
  const goalProgress = focus.goal?.priority ? Math.min(focus.goal.priority * 20, 85) : 50

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 1080, margin: '0 auto' }}>
      {/* Top Welcome Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {getGreeting()}, {userName}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0', fontSize: 13 }}>
            Stay focused. Small compounding steps, big life.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Flame size={15} color="var(--color-amber)" />
            <span>12 Day Streak</span>
          </div>
        </div>
      </div>

      {/* Top Grid: Hero Focus Cockpit & Timer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--space-4)' }}>
        {/* Hero Current Focus Cockpit Card */}
        <div
          className="card card-glow"
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'var(--space-5)',
            borderLeft: '4px solid var(--color-accent)',
          }}
        >
          <div>
            {/* Focus status header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--color-accent-text)',
                  textTransform: 'uppercase',
                }}
              >
                <Crosshair size={13} />
                Current Focus {focus.is_manual_override ? '(Pinned)' : '(Highest Priority)'}
              </span>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {focus.is_manual_override && (
                  <button onClick={clearOverride} style={{ fontSize: 12, padding: '4px 10px' }}>
                    Revert Auto
                  </button>
                )}
                <button
                  onClick={() => setEditingFocus((v) => !v)}
                  style={{ fontSize: 12, padding: '4px 12px' }}
                >
                  {editingFocus ? 'Close' : 'Set Focus'}
                </button>
              </div>
            </div>

            {editingFocus ? (
              <FocusEditor
                current={focus}
                onSaved={() => {
                  setEditingFocus(false)
                  load()
                }}
                onCancel={() => setEditingFocus(false)}
              />
            ) : (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800 }}>
                      {focus.department ? (
                        <Link to={`/departments/${focus.department.id}`} style={{ color: '#ffffff' }}>
                          {focus.department.name}
                        </Link>
                      ) : (
                        'No Department Set'
                      )}
                    </h2>

                    {focus.goal && (
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-accent-text)', marginTop: 4 }}>
                        {focus.goal.name}
                      </div>
                    )}
                    {focus.department?.current_phase && (
                      <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
                        Phase: <strong>{focus.department.current_phase}</strong>
                      </div>
                    )}
                  </div>

                  {/* Circular Progress Ring */}
                  {focus.goal && <CircularProgress percent={goalProgress} size={74} />}
                </div>

                {/* Next Action Box */}
                <div
                  style={{
                    marginTop: 'var(--space-4)',
                    background: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-3)',
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    <Zap size={13} color="var(--color-amber)" />
                    Immediate Next Action
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
                    {focus.next_action_roadmap_item ? (
                      focus.next_action_roadmap_item.name
                    ) : focus.note ? (
                      focus.note
                    ) : (
                      <span style={{ color: 'var(--color-text-faint)' }}>
                        No specific next action set — click "Set Focus" to lock one in.
                      </span>
                    )}
                  </div>

                  {focus.note && focus.next_action_roadmap_item && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Context: {focus.note}
                    </div>
                  )}

                  {focus.milestone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 4 }}>
                      <MilestoneIcon size={13} color="var(--color-cyan)" />
                      <span style={{ color: 'var(--color-text-muted)' }}>Milestone:</span>
                      <strong>{focus.milestone.name}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Start Focus Button */}
          {!editingFocus && (
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button
                className="primary"
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Play size={16} fill="currentColor" />
                Start Focus Session
              </button>
              <span style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>
                Restores context & starts time tracking
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Inline Timer HUD */}
        <InlineTimerWidget onStart={() => undefined} />
      </div>

      {/* Middle Grid: Upcoming Milestones & Active Departments Velocity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* Upcoming Milestones */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MilestoneIcon size={16} color="var(--color-accent-text)" />
              Upcoming Milestones
            </h3>
            {focus.department && (
              <Link to={`/departments/${focus.department.id}`} style={{ fontSize: 12 }}>
                View all ↗
              </Link>
            )}
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {upcomingMilestones.map((m) => (
              <div key={m.id} style={{ display: 'grid', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent-text)' }}>{m.progress}%</span>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${m.progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--color-accent), #38bdf8)',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}

            {upcomingMilestones.length === 0 && (
              <div style={{ color: 'var(--color-text-faint)', fontSize: 13 }}>
                No active milestones set for this department yet.
              </div>
            )}
          </div>
        </div>

        {/* Active Departments Velocity */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={16} color="var(--color-cyan)" />
              Active Departments
            </h3>
            <Link to="/departments" style={{ fontSize: 12 }}>
              Manage ↗
            </Link>
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {active_departments.map((dep) => (
              <div
                key={dep.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--color-surface-raised)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent-text)' }}>
                    #{dep.priority}
                  </span>
                  <Link to={`/departments/${dep.id}`} style={{ fontWeight: 600 }}>
                    {dep.name}
                  </Link>
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {dep.current_phase ?? 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Recent Activity Feed */}
      <div className="card">
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={16} color="var(--color-text-faint)" />
          Recent Momentum & Activity
        </h3>
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {recent_activity.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
              }}
            >
              <div>
                <strong style={{ color: 'var(--color-text)' }}>{item.entity_name}</strong>: updated{' '}
                <span style={{ color: 'var(--color-accent-text)' }}>{item.field_name}</span> to "{item.new_value}"
              </div>
              <span style={{ color: 'var(--color-text-faint)', fontSize: 11 }}>
                {new Date(item.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {recent_activity.length === 0 && (
            <div style={{ color: 'var(--color-text-faint)', fontSize: 13 }}>
              No recorded activity yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
