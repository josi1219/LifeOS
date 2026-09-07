import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  Plus,
  Sparkles,
} from 'lucide-react'
import api from '../api/client'
import type { CalendarMonthResponse, CalendarEventItem, UpcomingMilestoneSummary } from '../api/types'
import './CalendarView.css'

interface CalendarDay {
  dayNumber: number
  isCurrentMonth: boolean
  dateKey: string // YYYY-MM-DD
  displayDate: string
  events: CalendarEventItem[]
}

export function CalendarView() {
  const navigate = useNavigate()
  
  // Year & Month state (defaults to current date)
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1) // 1-12
  
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Month')
  
  const [events, setEvents] = useState<CalendarEventItem[]>([])
  const [upcomingMilestones, setUpcomingMilestones] = useState<UpcomingMilestoneSummary[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Fetch events whenever month/year changes
  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.get<CalendarMonthResponse>(`/calendar/events?year=${currentYear}&month=${currentMonth}`)
      .then((res) => {
        if (mounted && res) {
          setEvents(res.events || [])
          setUpcomingMilestones(res.upcoming_milestones || [])
        }
      })
      .catch((err) => {
        console.error('Failed to load calendar events', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [currentYear, currentMonth])

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1)
      setCurrentMonth(12)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1)
      setCurrentMonth(1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const monthName = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(currentYear, currentMonth - 1, 1)
    )
  }, [currentYear, currentMonth])

  // Build grid days
  const calendarDays: CalendarDay[] = useMemo(() => {
    const days: CalendarDay[] = []
    
    // First weekday of current month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const firstWeekday = new Date(currentYear, currentMonth - 1, 1).getDay()
    // Days in current month
    const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    // Days in previous month
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate()

    const padZero = (n: number) => String(n).padStart(2, '0')

    // Previous month padding
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const prevMonthNum = currentMonth === 1 ? 12 : currentMonth - 1
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i
      const dateKey = `${prevYear}-${padZero(prevMonthNum)}-${padZero(dayNum)}`
      days.push({
        dayNumber: dayNum,
        isCurrentMonth: false,
        dateKey,
        displayDate: new Date(prevYear, prevMonthNum - 1, dayNum).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        events: events.filter((ev) => ev.date === dateKey),
      })
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const dateKey = `${currentYear}-${padZero(currentMonth)}-${padZero(dayNum)}`
      days.push({
        dayNumber: dayNum,
        isCurrentMonth: true,
        dateKey,
        displayDate: new Date(currentYear, currentMonth - 1, dayNum).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        events: events.filter((ev) => ev.date === dateKey),
      })
    }

    // Next month padding (pad to 35 or 42 cells)
    const targetCells = days.length > 35 ? 42 : 35
    const remaining = targetCells - days.length
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
    const nextMonthNum = currentMonth === 12 ? 1 : currentMonth + 1
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const dateKey = `${nextYear}-${padZero(nextMonthNum)}-${padZero(dayNum)}`
      days.push({
        dayNumber: dayNum,
        isCurrentMonth: false,
        dateKey,
        displayDate: new Date(nextYear, nextMonthNum - 1, dayNum).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        events: events.filter((ev) => ev.date === dateKey),
      })
    }

    return days
  }, [currentYear, currentMonth, events])

  // Selected date formatted
  const selectedDateFormatted = useMemo(() => {
    try {
      const [y, m, d] = selectedDateKey.split('-').map(Number)
      if (!y || !m || !d) return selectedDateKey
      return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return selectedDateKey
    }
  }, [selectedDateKey])

  // Events for selected day
  const selectedDayEvents = useMemo(() => {
    return events.filter((ev) => ev.date === selectedDateKey)
  }, [events, selectedDateKey])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* =========================================================
          TOP BREADCRUMB / HEADER ROW
          ========================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'transparent',
              border: 'none',
              color: '#8e95a5',
              fontSize: 11.5,
              cursor: 'pointer',
              padding: 0,
              marginBottom: 2,
            }}
          >
            <ArrowLeft size={13} />
            <span>Calendar</span>
          </button>

          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>Calendar</div>
          <div style={{ fontSize: 11, color: '#8e95a5', marginTop: 1 }}>
            Your milestones, tasks and focus sessions, all in one place.
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN 2-COLUMN WORKSPACE
          ========================================================= */}
      <div className="flow-calendar-container">
        {/* LEFT COLUMN: CALENDAR TOOLBAR & MONTH GRID */}
        <div className="flow-calendar-main">
          <div className="flow-calendar-grid-card">
            {/* Toolbar: Navigation + View Mode Pills */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => navigate('/milestones')}
                  title="Create Milestone"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#ffffff',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer', padding: 2 }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', minWidth: 100, textAlign: 'center' }}>
                    {monthName}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer', padding: 2 }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
                {loading && (
                  <span style={{ fontSize: 10.5, color: '#00e599', opacity: 0.8 }}>Updating...</span>
                )}
              </div>

              {/* Month / Week / Day Pills */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: 2,
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                {(['Month', 'Week', 'Day'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    style={{
                      background: viewMode === mode ? 'rgba(0, 229, 153, 0.15)' : 'transparent',
                      color: viewMode === mode ? '#00e599' : '#8e95a5',
                      border: viewMode === mode ? '1px solid rgba(0, 229, 153, 0.3)' : 'none',
                      borderRadius: 'var(--radius-full)',
                      padding: '3px 12px',
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekday Header Labels */}
            <div className="flow-calendar-header-row">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Main Month Days Grid */}
            <div className="flow-calendar-grid">
              {calendarDays.map((day, idx) => {
                const isSelected = day.dateKey === selectedDateKey

                return (
                  <div
                    key={`${day.dateKey}-${idx}`}
                    className={`flow-cal-cell ${!day.isCurrentMonth ? 'other-month' : ''} ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedDateKey(day.dateKey)}
                  >
                    <div className="flow-cal-cell-header">{day.dayNumber}</div>

                    {day.events.map((ev) => (
                      <div key={ev.id} className="flow-cal-event-chip" title={`${ev.title} (${ev.duration})`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: ev.dot_color }} />
                          <span
                            style={{
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {ev.title}
                          </span>
                        </div>
                        <div style={{ paddingLeft: 8, color: '#8e95a5', fontSize: 8.5 }}>{ev.duration}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* UPCOMING MILESTONES ROW BELOW CALENDAR */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: '#ffffff' }}>
                <Flag size={14} color="#00e599" />
                <span>Upcoming Milestones</span>
              </div>
              <Link to="/milestones" style={{ fontSize: 11, color: '#8e95a5' }}>
                View All →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {upcomingMilestones.length === 0 ? (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    background: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    textAlign: 'center',
                    color: '#4e5564',
                    fontSize: 11.5,
                  }}
                >
                  No upcoming milestones. Create one in the Milestones page!
                </div>
              ) : (
                upcomingMilestones.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: 'var(--color-surface-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot_color }} />
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {m.title}
                      </span>
                    </div>
                    <div style={{ fontSize: 9.5, color: '#4e5564', paddingLeft: 12 }}>
                      {m.date ? `Due: ${m.date}` : 'No deadline'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, marginTop: 2 }}>
                      <div style={{ flex: 1, height: 3, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, overflow: 'hidden' }}>
                        <div style={{ width: `${m.progress}%`, height: '100%', background: m.dot_color }} />
                      </div>
                      <span style={{ fontSize: 9.5, color: '#8e95a5' }}>{m.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: SELECTED DAY SCHEDULE & MILESTONE PROGRESS */}
        <aside className="flow-calendar-sidebar">
          {/* Header: Date + Nav chevrons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff' }}>
              {selectedDateFormatted}
            </span>
          </div>

          {/* Today's Schedule */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8e95a5', textTransform: 'uppercase', marginBottom: 8 }}>
              Day's Schedule
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              {selectedDayEvents.length === 0 ? (
                <div style={{ fontSize: 11, color: '#4e5564', fontStyle: 'italic', padding: '6px 0' }}>
                  No scheduled sessions or milestones for this date.
                </div>
              ) : (
                selectedDayEvents.map((s) => (
                  <div key={s.id} className="flow-schedule-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot_color }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 11.5 }}>{s.title}</div>
                        <div style={{ fontSize: 9.5, color: '#4e5564' }}>{s.time}</div>
                      </div>
                    </div>
                    <span style={{ color: '#8e95a5', fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>{s.duration}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Milestone Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8e95a5', textTransform: 'uppercase' }}>
                Active Milestones
              </span>
              <Link to="/milestones" style={{ fontSize: 10.5, color: '#8e95a5' }}>
                View All →
              </Link>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {upcomingMilestones.length === 0 ? (
                <div style={{ fontSize: 11, color: '#4e5564', fontStyle: 'italic', padding: '6px 0' }}>
                  No active milestones.
                </div>
              ) : (
                upcomingMilestones.slice(0, 4).map((m) => (
                  <div key={m.id} style={{ display: 'grid', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot_color }} />
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {m.title}
                      </span>
                    </div>
                    <div style={{ fontSize: 9.5, color: '#4e5564', paddingLeft: 12 }}>
                      {m.date ? `Target: ${m.date}` : 'Ongoing'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, marginTop: 2 }}>
                      <div style={{ flex: 1, height: 3, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, overflow: 'hidden' }}>
                        <div style={{ width: `${m.progress}%`, height: '100%', background: m.dot_color }} />
                      </div>
                      <span style={{ fontSize: 9.5, color: '#8e95a5' }}>{m.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Quote with Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingTop: 10,
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Sparkles size={14} color="#00e599" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, fontStyle: 'italic', color: '#4e5564' }}>
              "Small steps every day lead to big results."
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
