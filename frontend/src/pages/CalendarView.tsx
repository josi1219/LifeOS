import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  Plus,
  Sparkles,
} from 'lucide-react'
import './CalendarView.css'

interface CalendarEvent {
  id: string
  title: string
  time: string
  duration: string
  dotColor: string
}

interface CalendarDay {
  dayNumber: number
  isCurrentMonth: boolean
  dateKey: string
  events: CalendarEvent[]
}

export function CalendarView() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState('Apr 20, 2025')
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Month')

  // Days in April 2025 (Starts on Tuesday, with Mar 30, 31 before and May 1, 2, 3 after)
  const calendarDays: CalendarDay[] = [
    { dayNumber: 30, isCurrentMonth: false, dateKey: 'Mar 30, 2025', events: [] },
    { dayNumber: 31, isCurrentMonth: false, dateKey: 'Mar 31, 2025', events: [] },
    { dayNumber: 1, isCurrentMonth: true, dateKey: 'Apr 1, 2025', events: [] },
    { dayNumber: 2, isCurrentMonth: true, dateKey: 'Apr 2, 2025', events: [] },
    {
      dayNumber: 3,
      isCurrentMonth: true,
      dateKey: 'Apr 3, 2025',
      events: [{ id: 'e1', title: 'Python Basics', time: '10:00', duration: '2h', dotColor: '#00e599' }],
    },
    { dayNumber: 4, isCurrentMonth: true, dateKey: 'Apr 4, 2025', events: [] },
    { dayNumber: 5, isCurrentMonth: true, dateKey: 'Apr 5, 2025', events: [] },
    { dayNumber: 6, isCurrentMonth: true, dateKey: 'Apr 6, 2025', events: [] },
    { dayNumber: 7, isCurrentMonth: true, dateKey: 'Apr 7, 2025', events: [] },
    {
      dayNumber: 8,
      isCurrentMonth: true,
      dateKey: 'Apr 8, 2025',
      events: [{ id: 'e2', title: 'ML Fundamentals', time: '14:00', duration: '3h', dotColor: '#8b5cf6' }],
    },
    { dayNumber: 9, isCurrentMonth: true, dateKey: 'Apr 9, 2025', events: [] },
    {
      dayNumber: 10,
      isCurrentMonth: true,
      dateKey: 'Apr 10, 2025',
      events: [{ id: 'e3', title: 'Data Structures', time: '11:00', duration: '2h', dotColor: '#00e599' }],
    },
    { dayNumber: 11, isCurrentMonth: true, dateKey: 'Apr 11, 2025', events: [] },
    { dayNumber: 12, isCurrentMonth: true, dateKey: 'Apr 12, 2025', events: [] },
    { dayNumber: 13, isCurrentMonth: true, dateKey: 'Apr 13, 2025', events: [] },
    {
      dayNumber: 14,
      isCurrentMonth: true,
      dateKey: 'Apr 14, 2025',
      events: [{ id: 'e4', title: 'Project Setup', time: '09:00', duration: '1h', dotColor: '#8b5cf6' }],
    },
    { dayNumber: 15, isCurrentMonth: true, dateKey: 'Apr 15, 2025', events: [] },
    { dayNumber: 16, isCurrentMonth: true, dateKey: 'Apr 16, 2025', events: [] },
    {
      dayNumber: 17,
      isCurrentMonth: true,
      dateKey: 'Apr 17, 2025',
      events: [{ id: 'e5', title: 'Build UI', time: '16:00', duration: '2h', dotColor: '#38bdf8' }],
    },
    { dayNumber: 18, isCurrentMonth: true, dateKey: 'Apr 18, 2025', events: [] },
    { dayNumber: 19, isCurrentMonth: true, dateKey: 'Apr 19, 2025', events: [] },
    {
      dayNumber: 20,
      isCurrentMonth: true,
      dateKey: 'Apr 20, 2025',
      events: [{ id: 'e6', title: 'Deep Learning', time: '09:00', duration: '3h', dotColor: '#00e599' }],
    },
    { dayNumber: 21, isCurrentMonth: true, dateKey: 'Apr 21, 2025', events: [] },
    { dayNumber: 22, isCurrentMonth: true, dateKey: 'Apr 22, 2025', events: [] },
    {
      dayNumber: 23,
      isCurrentMonth: true,
      dateKey: 'Apr 23, 2025',
      events: [{ id: 'e7', title: 'Journal', time: '20:00', duration: '1h', dotColor: '#8b5cf6' }],
    },
    { dayNumber: 24, isCurrentMonth: true, dateKey: 'Apr 24, 2025', events: [] },
    {
      dayNumber: 25,
      isCurrentMonth: true,
      dateKey: 'Apr 25, 2025',
      events: [{ id: 'e8', title: 'Milestone', time: 'All day', duration: 'All day', dotColor: '#f59e0b' }],
    },
    { dayNumber: 26, isCurrentMonth: true, dateKey: 'Apr 26, 2025', events: [] },
    { dayNumber: 27, isCurrentMonth: true, dateKey: 'Apr 27, 2025', events: [] },
    {
      dayNumber: 28,
      isCurrentMonth: true,
      dateKey: 'Apr 28, 2025',
      events: [{ id: 'e9', title: 'Review & Reflect', time: '18:00', duration: '1h', dotColor: '#8b5cf6' }],
    },
    { dayNumber: 29, isCurrentMonth: true, dateKey: 'Apr 29, 2025', events: [] },
    { dayNumber: 30, isCurrentMonth: true, dateKey: 'Apr 30, 2025', events: [] },
    { dayNumber: 1, isCurrentMonth: false, dateKey: 'May 1, 2025', events: [] },
    { dayNumber: 2, isCurrentMonth: false, dateKey: 'May 2, 2025', events: [] },
    { dayNumber: 3, isCurrentMonth: false, dateKey: 'May 3, 2025', events: [] },
  ]

  // Daily Schedule items for the selected day (Apr 20)
  const todaySchedule = [
    { title: 'Deep Learning', time: '09:00 - 12:00', duration: '3h', dotColor: '#00e599' },
    { title: 'Lunch Break', time: '12:00 - 13:00', duration: '1h', dotColor: '#4e5564' },
    { title: 'Project Work', time: '13:00 - 15:00', duration: '2h', dotColor: '#38bdf8' },
    { title: 'Workout', time: '16:00 - 17:00', duration: '1h', dotColor: '#8b5cf6' },
    { title: 'Free Time', time: '18:00 - 20:00', duration: '2h', dotColor: '#4e5564' },
  ]

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
                    style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer', padding: 2 }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>April 2025</span>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer', padding: 2 }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
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
                const isSelected = day.dateKey === selectedDate

                return (
                  <div
                    key={idx}
                    className={`flow-cal-cell ${!day.isCurrentMonth ? 'other-month' : ''} ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedDate(day.dateKey)}
                  >
                    <div className="flow-cal-cell-header">{day.dayNumber}</div>

                    {day.events.map((ev) => (
                      <div key={ev.id} className="flow-cal-event-chip">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: ev.dotColor }} />
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
              {[
                { title: 'Finish Python Basics', date: 'Apr 25, 2025', progress: 40, dotColor: '#00e599' },
                { title: 'Complete ML Fundamentals', date: 'May 10, 2025', progress: 30, dotColor: '#8b5cf6' },
                { title: 'Build Portfolio Website', date: 'Jun 15, 2025', progress: 0, dotColor: '#38bdf8' },
              ].map((m) => (
                <div
                  key={m.title}
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
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dotColor }} />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#ffffff' }}>{m.title}</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: '#4e5564', paddingLeft: 12 }}>{m.date}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, marginTop: 2 }}>
                    <div style={{ flex: 1, height: 3, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, overflow: 'hidden' }}>
                      <div style={{ width: `${m.progress}%`, height: '100%', background: '#00e599' }} />
                    </div>
                    <span style={{ fontSize: 9.5, color: '#8e95a5' }}>{m.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: SELECTED DAY SCHEDULE & MILESTONE PROGRESS */}
        <aside className="flow-calendar-sidebar">
          {/* Header: Date + Nav chevrons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Sat, {selectedDate}</span>
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer', padding: 2 }}
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer', padding: 2 }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Today's Schedule */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8e95a5', textTransform: 'uppercase', marginBottom: 8 }}>
              Today's Schedule
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              {todaySchedule.map((s, idx) => (
                <div key={idx} className="flow-schedule-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dotColor }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{s.title}</div>
                      <div style={{ fontSize: 9.5, color: '#4e5564' }}>{s.time}</div>
                    </div>
                  </div>
                  <span style={{ color: '#8e95a5', fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>{s.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8e95a5', textTransform: 'uppercase' }}>
                Milestone Progress
              </span>
              <Link to="/milestones" style={{ fontSize: 10.5, color: '#8e95a5' }}>
                View All →
              </Link>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e599' }} />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#ffffff' }}>Build a Profitable Trading Strategy</span>
                </div>
                <div style={{ fontSize: 9.5, color: '#4e5564', paddingLeft: 12, marginTop: 1 }}>May 30, 2025</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, marginTop: 4 }}>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, overflow: 'hidden' }}>
                    <div style={{ width: '27%', height: '100%', background: '#00e599' }} />
                  </div>
                  <span style={{ fontSize: 9.5, color: '#8e95a5' }}>27%</span>
                </div>
              </div>

              {/* Sub-item checklist */}
              <div style={{ display: 'grid', gap: 5, paddingLeft: 12, marginTop: 4 }}>
                {[
                  { name: 'Python Basics', pct: '100%', color: '#00e599' },
                  { name: 'Data Structures', pct: '60%', color: '#00e599' },
                  { name: 'Machine Learning', pct: '15%', color: '#8b5cf6' },
                  { name: 'Trading Strategy', pct: '0%', color: '#4e5564' },
                ].map((item) => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: item.color }} />
                      <span style={{ color: '#8e95a5' }}>{item.name}</span>
                    </div>
                    <span style={{ color: '#4e5564', fontWeight: 600 }}>{item.pct}</span>
                  </div>
                ))}
              </div>
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
