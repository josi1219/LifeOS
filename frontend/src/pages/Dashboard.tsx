import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Brain,
  Calendar as CalendarIcon,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  Flag,
  Globe,
  Heart,
  LineChart,
  Plus,
  Target,
  Zap,
} from 'lucide-react'
import api from '../api/client'
import type { Goal, Milestone, CalendarMonthResponse, DashboardOverview } from '../api/types'
import { useTimer } from '../features/timer/TimerContext'
import './Dashboard.css'

export function Dashboard() {
  const navigate = useNavigate()
  const { startTimer, summary, setTargetDurationSeconds } = useTimer()

  // Real backend states
  const [goals, setGoals] = useState<Goal[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [calendarEvents, setCalendarEvents] = useState<Record<number, { type: string; color: string }>>({})

  // Selected Goal and Roadmap Item state
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null)
  const [selectedRoadmapItemId, setSelectedRoadmapItemId] = useState<number | null>(null)
  const [roadmapSteps, setRoadmapSteps] = useState<
    Array<{
      id: number
      name: string
      estimated_hours?: number
      invested_hours?: number
      progress?: number
      children: Array<{
        id: number
        name: string
        estimated_hours?: number
        invested_hours?: number
        progress?: number
      }>
    }>
  >([])
  const [isGoalDropdownOpen, setIsGoalDropdownOpen] = useState(false)
  const [isStepDropdownOpen, setIsStepDropdownOpen] = useState(false)
  const [overviewRange, setOverviewRange] = useState('Last 30 days')
  const [isOverviewDropdownOpen, setIsOverviewDropdownOpen] = useState(false)

  // Calendar month state
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1)

  // Fetch initial dashboard data
  useEffect(() => {
    let mounted = true

    // 1. Goals
    api
      .get<Goal[]>('/goals')
      .then((res) => {
        if (mounted && res && res.length > 0) {
          setGoals(res)
          setSelectedGoalId(res[0].id)
        }
      })
      .catch(() => {})

    // 2. Milestones
    api
      .get<Milestone[]>('/milestones')
      .then((res) => {
        if (mounted && res) {
          setMilestones(res)
        }
      })
      .catch(() => {})

    // 3. Dashboard Overview
    api
      .get<DashboardOverview>('/dashboard/overview')
      .then((res) => {
        if (mounted && res) {
          setOverview(res)
        }
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  // Fetch calendar markers when year/month changes
  useEffect(() => {
    let mounted = true
    api
      .get<CalendarMonthResponse>(`/calendar/events?year=${currentYear}&month=${currentMonth}`)
      .then((res) => {
        if (mounted && res && res.events) {
          const markers: Record<number, { type: string; color: string }> = {}
          for (const ev of res.events) {
            try {
              const dayNum = parseInt(ev.date.split('-')[2], 10)
              if (!isNaN(dayNum)) {
                markers[dayNum] = {
                  type: ev.type === 'milestone' ? 'milestone-ring' : 'dot-only',
                  color: ev.dot_color || '#00e599',
                }
              }
            } catch {
              // ignore
            }
          }
          setCalendarEvents(markers)
        }
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [currentYear, currentMonth])

  // Fetch roadmap when goal changes
  useEffect(() => {
    if (!selectedGoalId) return
    let mounted = true
    api.get<any>(`/goals/${selectedGoalId}/roadmap`)
      .then((data) => {
        if (!mounted || !data?.items) return
        const steps = data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          estimated_hours: item.estimated_hours ?? 0,
          invested_hours: item.invested_hours ?? 0,
          progress: item.progress ?? 0,
          children: (item.children || []).map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            estimated_hours: ch.estimated_hours ?? 0,
            invested_hours: ch.invested_hours ?? 0,
            progress: ch.progress ?? 0,
          })),
        }))
        setRoadmapSteps(steps)
        if (steps.length > 0) {
          setSelectedRoadmapItemId(steps[0].children?.[0]?.id || steps[0].id)
        }
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [selectedGoalId])

  const selectedGoal = goals.find(g => g.id === selectedGoalId) || goals[0] || null
  const selectedStep = roadmapSteps.find(s => s.id === selectedRoadmapItemId) || roadmapSteps[0] || null

  const selectedSubSkill = useMemo(() => {
    for (const step of roadmapSteps) {
      for (const child of step.children) {
        if (child.id === selectedRoadmapItemId) return child
      }
      if (step.id === selectedRoadmapItemId) return step
    }
    return null
  }, [roadmapSteps, selectedRoadmapItemId])

  // Planned focus duration (max 4 hours = 240 mins)
  const [plannedMinutes, setPlannedMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('lifeos_planned_focus_seconds')
    return saved ? Math.max(5, Math.min(240, Math.round(parseInt(saved, 10) / 60))) : 180
  })
  const dialRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const updateMinutesFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialRef.current) return
      const rect = dialRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = clientX - cx
      const dy = clientY - cy

      // Angle in degrees where 12 o'clock is 0 degrees, clockwise:
      let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90
      if (deg < 0) deg += 360

      // Map 0 - 360 to 0 - 240 minutes (max 4 hours)
      const rawMins = (deg / 360) * 240
      // Snap to nearest 5 minutes
      let snapped = Math.round(rawMins / 5) * 5
      if (snapped < 5) {
        snapped = deg > 345 ? 240 : 5
      }
      if (snapped > 240) snapped = 240

      setPlannedMinutes(snapped)
      setTargetDurationSeconds(snapped * 60)
    },
    [setTargetDurationSeconds]
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    updateMinutesFromEvent(e.clientX, e.clientY)
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => {
      updateMinutesFromEvent(e.clientX, e.clientY)
    }
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, updateMinutesFromEvent])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setIsDragging(true)
      updateMinutesFromEvent(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      updateMinutesFromEvent(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleStartFocus = async () => {
    try {
      const targetSecs = plannedMinutes * 60
      setTargetDurationSeconds(targetSecs)
      await startTimer(
        {
          goal_id: selectedGoalId ?? undefined,
          department_id: selectedGoal?.department_id ?? undefined,
          roadmap_item_id: selectedRoadmapItemId ?? undefined,
          note: `Focusing on ${selectedGoal?.name ?? 'Deep Work'} - ${selectedStep?.name ?? 'General'}`,
        },
        targetSecs
      )
    } catch {
      // ignore
    }
    navigate('/focus')
  }

  // Hero banner milestone: nearest upcoming active milestone
  const nextMilestone = useMemo(() => {
    const activeWithDates = milestones
      .filter((m) => m.status !== 'completed' && m.completion_date)
      .sort((a, b) => new Date(a.completion_date!).getTime() - new Date(b.completion_date!).getTime())

    if (activeWithDates.length > 0) return activeWithDates[0]
    return milestones.find((m) => m.status !== 'completed') || null
  }, [milestones])

  const milestoneDueText = useMemo(() => {
    if (!nextMilestone || !nextMilestone.completion_date) return 'Target scheduled'
    try {
      const diff = Math.ceil(
        (new Date(nextMilestone.completion_date).getTime() - Date.now()) / (1000 * 3600 * 24)
      )
      if (diff > 0) return `Due in ${diff} day${diff === 1 ? '' : 's'}`
      if (diff === 0) return 'Due today'
      return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}`
    } catch {
      return 'Target scheduled'
    }
  }, [nextMilestone])

  // Progress calculations
  const progressPercent = useMemo(() => {
    if (goals.length > 0) {
      const total = goals.reduce((acc, g) => acc + (g.progress || 0), 0)
      return Math.round(total / goals.length)
    }
    return 0
  }, [goals])

  const gaugeSize = 98
  const gaugeStroke = 6.5
  const gaugeRadius = (gaugeSize - gaugeStroke) / 2
  const gaugeCircumference = 2 * Math.PI * gaugeRadius
  const gaugeOffset = gaugeCircumference - (progressPercent / 100) * gaugeCircumference

  // Countdown timer circle for Today's Focus
  const timerDialSize = 118
  const timerStroke = 5.5
  const timerRadius = (timerDialSize - timerStroke) / 2
  const timerCircumference = 2 * Math.PI * timerRadius

  const dialFraction = Math.max(0.01, Math.min(1, plannedMinutes / 240))
  const dialOffset = timerCircumference * (1 - dialFraction)
  const angleDeg = dialFraction * 360
  const handleAngleRad = ((angleDeg - 90) * Math.PI) / 180
  const handleX = timerDialSize / 2 + timerRadius * Math.cos(handleAngleRad)
  const handleY = timerDialSize / 2 + timerRadius * Math.sin(handleAngleRad)

  const plannedHrs = Math.floor(plannedMinutes / 60)
  const plannedMins = plannedMinutes % 60
  const digitalTimeStr = `${plannedHrs.toString().padStart(2, '0')}:${plannedMins.toString().padStart(2, '0')}:00`
  const plannedHoursLabel = `${plannedHrs}h ${plannedMins}m`

  // Dynamic Month Calendar
  const daysInMonth = useMemo(() => {
    const total = new Date(currentYear, currentMonth, 0).getDate()
    return Array.from({ length: total }, (_, i) => i + 1)
  }, [currentYear, currentMonth])

  const startDayOffset = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).getDay()
  }, [currentYear, currentMonth])

  const currentMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(currentYear, currentMonth - 1, 1)
    )
  }, [currentYear, currentMonth])

  // Mini time formatted
  const todaySeconds = summary?.today_seconds || 0
  const completedHoursStr = `${Math.floor(todaySeconds / 3600)}h ${Math.floor((todaySeconds % 3600) / 60)}m`
  const totalSeconds = summary?.total_seconds || 0
  const totalHoursStr = `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`

  const totalTimeDisplay = useMemo(() => {
    if (selectedSubSkill && selectedSubSkill.estimated_hours && selectedSubSkill.estimated_hours > 0) {
      const inv = selectedSubSkill.invested_hours ?? 0
      const est = selectedSubSkill.estimated_hours
      return {
        label: `${inv}h / ${est}h`,
        percent: Math.min(100, selectedSubSkill.progress ?? Math.round((inv / est) * 100)),
      }
    }
    return {
      label: totalHoursStr,
      percent: Math.min(100, Math.round((totalSeconds / (100 * 3600)) * 100)),
    }
  }, [selectedSubSkill, totalHoursStr, totalSeconds])

  const handlePrevCalMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1)
      setCurrentMonth(12)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextCalMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1)
      setCurrentMonth(1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  return (
    <div className="flow-dashboard-container">
      {/* =========================================================
          LEFT MAIN COLUMN (Banner + Mid Row + Bottom Row)
          ========================================================= */}
      <div className="flow-dashboard-main">
        {/* 1. TOP HERO BANNER ("YOUR NEXT MILESTONE") */}
        <div className="flow-milestone-banner">
          {/* Dawn Mountain Sunrise Backdrop Photo & Overlay */}
          <div className="flow-milestone-photo-bg" />
          <div className="flow-milestone-gradient-overlay" />

          {/* Left Milestone Information */}
          <div className="flow-milestone-content">
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: '#8e95a5',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              YOUR NEXT MILESTONE
            </div>

            {nextMilestone ? (
              <>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 19,
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.25,
                  }}
                >
                  {nextMilestone.name}
                </h1>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    marginTop: 6,
                    fontSize: 11.5,
                    color: '#8e95a5',
                  }}
                >
                  <CalendarIcon size={12} color="#4e5564" />
                  <span>{milestoneDueText}</span>
                  <span style={{ color: '#4e5564' }}>•</span>
                  <span>
                    {nextMilestone.skills_completed_count !== undefined && nextMilestone.skills_total_count !== undefined
                      ? `${nextMilestone.skills_completed_count}/${nextMilestone.skills_total_count} skills completed`
                      : nextMilestone.skill_names && nextMilestone.skill_names.length > 0
                      ? `${nextMilestone.skill_names.length} skills linked`
                      : '0 skills linked'}
                  </span>
                </div>

                {/* Progress Bar & Percentage */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, maxWidth: 330 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 5,
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 2.5,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${nextMilestone.progress || 0}%`,
                        height: '100%',
                        background: '#00e599',
                        borderRadius: 2.5,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#ffffff' }}>
                    {nextMilestone.progress || 0}%
                  </span>
                </div>

                {/* View Details Pill Button */}
                <Link
                  to="/milestones"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 12,
                    padding: '5px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#ffffff',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00e599'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <span>View Details</span>
                  <ArrowRight size={12} />
                </Link>
              </>
            ) : (
              <>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.25,
                  }}
                >
                  No upcoming milestone scheduled
                </h1>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11.5,
                    color: '#8e95a5',
                    maxWidth: 420,
                    lineHeight: 1.4,
                  }}
                >
                  Connect your roadmap sub-skills to milestones to track target completion deadlines.
                </div>
                <Link
                  to="/milestones"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 14,
                    padding: '5px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(0, 229, 153, 0.12)',
                    border: '1px solid rgba(0, 229, 153, 0.3)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#00e599',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Plus size={12} />
                  <span>Create Milestone</span>
                </Link>
              </>
            )}
          </div>

          {/* Right Quote */}
          <div className="flow-milestone-quote">
            <div>"Progress isn't about being perfect, it's about showing up consistently."</div>
            <div style={{ marginTop: 4, color: 'var(--color-text-faint)' }}>——</div>
          </div>
        </div>

        {/* 2. MIDDLE ROW: TODAY'S FOCUS & PROGRESS OVERVIEW (Equal 50% split) */}
        <div className="flow-dashboard-mid-row">
          {/* TODAY'S FOCUS CARD */}
          <div
            className="flow-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Today's Focus</div>
              <div style={{ fontSize: 11, color: '#8e95a5', marginTop: 1 }}>
                Keep going. You're building the life you want.
              </div>
            </div>

            <div className="flow-focus-body">
              {/* Dial Column */}
              <div className="flow-dial-col">
                <div
                  ref={dialRef}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    position: 'relative',
                    width: timerDialSize,
                    height: timerDialSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    touchAction: 'none',
                  }}
                  title="Drag the knob or click around the ring to set focus duration (up to 4 hours)"
                >
                  <svg
                    width={timerDialSize}
                    height={timerDialSize}
                    style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
                  >
                    {/* Background Track */}
                    <circle
                      cx={timerDialSize / 2}
                      cy={timerDialSize / 2}
                      r={timerRadius}
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth={timerStroke}
                      fill="none"
                    />
                    {/* Active Arc (Rotated -90deg to begin at 12 o'clock) */}
                    <circle
                      cx={timerDialSize / 2}
                      cy={timerDialSize / 2}
                      r={timerRadius}
                      stroke="#00e599"
                      strokeWidth={timerStroke}
                      fill="none"
                      strokeDasharray={timerCircumference}
                      strokeDashoffset={dialOffset}
                      strokeLinecap="round"
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: `${timerDialSize / 2}px ${timerDialSize / 2}px`,
                        filter: 'drop-shadow(0 0 6px rgba(0, 229, 153, 0.5))',
                        transition: isDragging ? 'none' : 'stroke-dashoffset 0.1s ease',
                      }}
                    />
                    {/* Draggable Knob Handle */}
                    <circle
                      cx={handleX}
                      cy={handleY}
                      r={6.5}
                      fill="#00e599"
                      stroke="#ffffff"
                      strokeWidth={2}
                      style={{
                        filter: 'drop-shadow(0 0 7px rgba(0, 229, 153, 0.85))',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        transition: isDragging ? 'none' : 'cx 0.1s ease, cy 0.1s ease',
                      }}
                    />
                  </svg>

                  {/* Center Digital Display */}
                  <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 16.5,
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                      }}
                    >
                      {digitalTimeStr}
                    </div>
                    <div style={{ fontSize: 9, color: '#8e95a5', marginTop: 2, fontWeight: 500 }}>
                      Focus Session
                    </div>
                  </div>
                </div>

                {/* Mint Pill Button */}
                <button
                  type="button"
                  onClick={handleStartFocus}
                  style={{
                    width: '100%',
                    maxWidth: 120,
                    marginTop: 10,
                    background: '#00e599',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '6.5px 14px',
                    color: '#080b11',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 0 14px rgba(0, 229, 153, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#00f5a0'
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 153, 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#00e599'
                    e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 229, 153, 0.35)'
                  }}
                >
                  Start Focus
                </button>
              </div>

              {/* Selector Controls & Mini Stats */}
              <div className="flow-focus-right" style={{ display: 'grid', gap: 7 }}>
                {/* Select Skill Dropdown */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 10, color: '#8e95a5', marginBottom: 3, fontWeight: 500 }}>
                    Select Focus Track / Skill
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsGoalDropdownOpen(!isGoalDropdownOpen)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '5.5px 9px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                      <Brain size={13} color="#8b5cf6" style={{ flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedGoal?.name || 'Select a goal'}
                      </span>
                    </div>
                    <ChevronDown size={12} color="#4e5564" style={{ flexShrink: 0 }} />
                  </button>

                  {isGoalDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        background: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        zIndex: 50,
                        maxHeight: 180,
                        overflowY: 'auto',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      {goals.map((goal) => (
                        <div
                          key={goal.id}
                          onClick={() => {
                            setSelectedGoalId(goal.id)
                            setSelectedRoadmapItemId(null)
                            setIsGoalDropdownOpen(false)
                          }}
                          style={{
                            padding: '7px 10px',
                            fontSize: 11.5,
                            color: goal.id === selectedGoalId ? '#00e599' : '#ffffff',
                            cursor: 'pointer',
                            background: goal.id === selectedGoalId ? 'rgba(0, 229, 153, 0.08)' : 'transparent',
                          }}
                        >
                          {goal.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Select Sub-Skill Dropdown */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 10, color: '#8e95a5', marginBottom: 3, fontWeight: 500 }}>
                    Select Sub Skill <span style={{ color: '#4e5564' }}>(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsStepDropdownOpen(!isStepDropdownOpen)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '5.5px 9px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                      <Zap size={13} color="#8b5cf6" style={{ flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedStep?.name || 'Select a step'}
                      </span>
                    </div>
                    <ChevronDown size={12} color="#4e5564" style={{ flexShrink: 0 }} />
                  </button>

                  {isStepDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        background: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        zIndex: 50,
                        maxHeight: 180,
                        overflowY: 'auto',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      {roadmapSteps.map((step) => (
                        <div key={`step-${step.id}`}>
                          <div style={{ padding: '7px 10px', fontSize: 11, fontWeight: 700, color: '#8e95a5', background: 'rgba(255, 255, 255, 0.02)' }}>
                            {step.name}
                          </div>
                          {step.children.map((child) => (
                            <div
                              key={child.id}
                              onClick={() => {
                                setSelectedRoadmapItemId(child.id)
                                setIsStepDropdownOpen(false)
                              }}
                              style={{
                                padding: '7px 10px 7px 20px',
                                fontSize: 11.5,
                                color: child.id === selectedRoadmapItemId ? '#8b5cf6' : '#ffffff',
                                cursor: 'pointer',
                                background: child.id === selectedRoadmapItemId ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                              }}
                            >
                              {child.name}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3 Mini Stats Box */}
                <div
                  style={{
                    marginTop: 2,
                    padding: '7px 9px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1.25fr',
                    gap: 6,
                  }}
                >
                  {/* Planned Time */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>
                      <Clock size={9} />
                      <span>Planned</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', marginTop: 1 }}>
                      {plannedHoursLabel}
                    </div>
                    <div style={{ height: 2.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, marginTop: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${(plannedMinutes / 240) * 100}%`, height: '100%', background: '#00e599' }} />
                    </div>
                  </div>

                  {/* Completed Today */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>
                      <CheckSquare size={9} />
                      <span>Completed</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', marginTop: 1 }}>
                      {completedHoursStr}
                    </div>
                    <div style={{ height: 2.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, marginTop: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${todaySeconds > 0 ? Math.min(100, Math.round((todaySeconds / (plannedMinutes * 60)) * 100)) : 0}%`,
                          height: '100%',
                          background: '#00e599',
                        }}
                      />
                    </div>
                  </div>

                  {/* Total Progress */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>
                      <CheckCircle2 size={9} />
                      <span>Total Time</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>{totalTimeDisplay.label}</span>
                    </div>
                    <div style={{ height: 2.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, marginTop: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${totalTimeDisplay.percent}%`, height: '100%', background: '#00e599' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PROGRESS OVERVIEW CARD */}
          <div
            className="flow-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Progress Overview</div>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsOverviewDropdownOpen(!isOverviewDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 10.5,
                    color: '#8e95a5',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '2.5px 7px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  <span>{overviewRange}</span>
                  <ChevronDown size={10} />
                </button>

                {isOverviewDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 4,
                      background: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      zIndex: 50,
                      boxShadow: 'var(--shadow-md)',
                      minWidth: 110,
                      overflow: 'hidden',
                    }}
                  >
                    {['Last 7 days', 'Last 30 days', 'All time'].map((opt) => (
                      <div
                        key={opt}
                        onClick={() => {
                          setOverviewRange(opt)
                          setIsOverviewDropdownOpen(false)
                        }}
                        style={{
                          padding: '6px 9px',
                          fontSize: 11,
                          color: opt === overviewRange ? '#00e599' : '#ffffff',
                          cursor: 'pointer',
                          background: opt === overviewRange ? 'rgba(0, 229, 153, 0.08)' : 'transparent',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center Donut Gauge */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
              <div
                style={{
                  position: 'relative',
                  width: gaugeSize,
                  height: gaugeSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width={gaugeSize} height={gaugeSize} style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx={gaugeSize / 2}
                    cy={gaugeSize / 2}
                    r={gaugeRadius}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={gaugeStroke}
                    fill="none"
                  />
                  <circle
                    cx={gaugeSize / 2}
                    cy={gaugeSize / 2}
                    r={gaugeRadius}
                    stroke="#00e599"
                    strokeWidth={gaugeStroke}
                    fill="none"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeOffset}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(0, 229, 153, 0.35))' }}
                  />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                    {progressPercent}%
                  </div>
                  <div style={{ fontSize: 9.5, color: '#8e95a5', marginTop: 2 }}>
                    Avg Goal Progress
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Progress Breakdown List */}
            <div style={{ display: 'grid', gap: 7 }}>
              {goals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 8px', color: '#8e95a5', fontSize: 11.5 }}>
                  No active goals yet. Create a goal to track your skill progression.
                </div>
              ) : (
                goals.slice(0, 4).map((g, i) => {
                  const colors = ['#8b5cf6', '#38bdf8', '#00e599', '#f59e0b']
                  const icons = [Brain, Globe, LineChart, Clock]
                  const color = colors[i % colors.length]
                  const Icon = icons[i % icons.length]
                  const item = {
                    name: g.name,
                    hours: `${g.completed_milestones_count || 0}/${g.milestones_count || 0} milestones`,
                    pct: g.progress || 0,
                    icon: Icon,
                    color,
                  }
                  return (
                    <div key={item.name} style={{ display: 'grid', gap: 3 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 'var(--radius-xs)',
                              background: `${item.color}15`,
                              color: item.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={11} />
                          </div>
                          <span style={{ color: '#ffffff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ color: '#8e95a5', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                            {item.hours}
                          </span>
                          <span style={{ color: '#8e95a5', fontSize: 10, fontWeight: 600, minWidth: 24, textAlign: 'right' }}>
                            {item.pct}%
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          height: 3,
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 1.5,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${item.pct}%`,
                            height: '100%',
                            background: item.color,
                            borderRadius: 1.5,
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* 3. BOTTOM ROW: ACTIVE GOALS & RECENT ACTIVITY (Equal 50% split) */}
        <div className="flow-dashboard-bottom-row">
          {/* ACTIVE GOALS CARD */}
          <div className="flow-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Target size={15} color="#00e599" />
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff' }}>Active Goals</span>
              </div>
              <Link to="/goals" style={{ fontSize: 10.5, color: '#8e95a5' }}>
                View All →
              </Link>
            </div>
            <div style={{ fontSize: 10.5, color: '#8e95a5', marginTop: 1 }}>
              Your long term vision, broken down into action.
            </div>

            <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
              {goals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: 12, color: '#8e95a5', marginBottom: 6 }}>No goals yet</div>
                  <Link to="/goals" style={{ fontSize: 11, color: '#00e599', fontWeight: 600, textDecoration: 'none' }}>
                    Create your first goal →
                  </Link>
                </div>
              ) : (
                goals.slice(0, 3).map((goal, i) => {
                  const icons = [Brain, Code, Heart, BarChart3]
                  const colors = ['#8b5cf6', '#00e599', '#f43f5e', '#38bdf8']
                  const Icon = icons[i % icons.length]
                  const badgeBg = colors[i % colors.length]
                  return (
                    <div
                      key={goal.id || goal.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 'var(--radius-sm)',
                            background: `${badgeBg}18`,
                            color: badgeBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={14} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#ffffff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {goal.name}
                          </div>
                          <div style={{ fontSize: 9.5, color: '#4e5564', marginTop: 1 }}>
                            {`${goal.completed_milestones_count || 0}/${goal.milestones_count || 0} milestones completed`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ width: 56, height: 3.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${goal.progress || 0}%`, height: '100%', background: '#00e599' }} />
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#8e95a5', minWidth: 24, textAlign: 'right' }}>
                          {goal.progress || 0}%
                        </span>
                        <ChevronRight size={12} color="#4e5564" />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* RECENT ACTIVITY CARD */}
          <div className="flow-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Zap size={15} color="#00e599" />
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff' }}>Recent Activity</span>
              </div>
              <Link to="/journal" style={{ fontSize: 10.5, color: '#8e95a5' }}>
                View All →
              </Link>
            </div>

            <div style={{ display: 'grid', gap: 9, marginTop: 10 }}>
              {overview?.recent_activity && overview.recent_activity.length > 0 ? (
                overview.recent_activity.slice(0, 4).map((act: { entity_name: string; field_name: string; new_value: string | null; changed_at: string }, idx: number) => {
                  const title = `Updated ${act.entity_name} (${act.field_name})`
                  const subtitle = act.new_value ? `Changed to: ${act.new_value}` : undefined
                  const date = new Date(act.changed_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                  const dotColor = '#00e599'
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: dotColor,
                          marginTop: 4,
                          flexShrink: 0,
                          boxShadow: `0 0 5px ${dotColor}80`,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, color: '#ffffff', fontWeight: 500, lineHeight: 1.25 }}>
                          {title}
                        </div>
                        {subtitle && (
                          <div style={{ fontSize: 10.5, color: '#8e95a5', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {subtitle}
                          </div>
                        )}
                        <div style={{ fontSize: 9.5, color: '#4e5564', marginTop: 1 }}>
                          {date}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: '#8e95a5', fontSize: 11.5 }}>
                  No recent activity yet. Start a focus session to record your progress.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT SIDEBAR STREAM (Calendar + Upcoming Milestones + Quote)
          ========================================================= */}
      <aside className="flow-dashboard-sidebar">
        {/* 1. CALENDAR WIDGET */}
        <div className="flow-card">
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>Calendar</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#8e95a5' }}>{currentMonthLabel}</span>
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                type="button"
                onClick={handlePrevCalMonth}
                style={{ background: 'transparent', border: 'none', padding: 2, color: '#4e5564', cursor: 'pointer' }}
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={handleNextCalMonth}
                style={{ background: 'transparent', border: 'none', padding: 2, color: '#4e5564', cursor: 'pointer' }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Weekday Header Labels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontSize: 9.5,
              color: '#4e5564',
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Day Numbers Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px 1px',
              textAlign: 'center',
              fontSize: 10.5,
            }}
          >
            {/* Start day padding */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`pad-${i}`} style={{ color: 'rgba(255, 255, 255, 0.08)', height: 24 }} />
            ))}

            {daysInMonth.map((day) => {
              const marker = calendarEvents[day]
              const isToday =
                day === new Date().getDate() &&
                currentMonth === new Date().getMonth() + 1 &&
                currentYear === new Date().getFullYear()

              let bg = isToday ? 'rgba(0, 229, 153, 0.15)' : 'transparent'
              let color = isToday ? '#00e599' : '#8e95a5'
              let border = isToday ? '1px solid #00e599' : '1px solid transparent'

              if (marker?.type === 'milestone-ring') {
                border = '1px solid #00e599'
                color = '#00e599'
              }

              return (
                <div
                  key={day}
                  onClick={() => navigate('/calendar')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    minHeight: 26,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: bg,
                      color,
                      border,
                      fontWeight: isToday || marker ? 700 : 500,
                      fontSize: 10.5,
                      lineHeight: 1,
                    }}
                  >
                    {day}
                  </div>
                  {marker && (
                    <div
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: marker.color,
                        marginTop: 1,
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Calendar Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: 10.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00e599' }} />
              <span style={{ color: '#8e95a5' }}>Milestone</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#8b5cf6' }} />
              <span style={{ color: '#8e95a5' }}>Goal Deadline</span>
            </div>
          </div>
        </div>

        {/* 2. UPCOMING MILESTONES WIDGET */}
        <div className="flow-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Flag size={14} color="#00e599" />
              <span style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff' }}>Upcoming Milestones</span>
            </div>
            <Link to="/milestones" style={{ fontSize: 10.5, color: '#8e95a5' }}>
              View All →
            </Link>
          </div>

          <div style={{ display: 'grid', gap: 7 }}>
            {(() => {
              const activeUpcoming = milestones.filter((m) => m.status !== 'completed')
              if (activeUpcoming.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '20px 8px', color: '#8e95a5', fontSize: 11.5 }}>
                    No upcoming milestones scheduled.
                  </div>
                )
              }
              return activeUpcoming.slice(0, 4).map((m, idx) => {
                const colors = ['#00e599', '#8b5cf6', '#38bdf8', '#f59e0b']
                let dateMonth = 'DUE'
                let dateDay = '—'
                if (m.completion_date) {
                  try {
                    const d = new Date(m.completion_date)
                    dateMonth = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                    dateDay = String(d.getDate())
                  } catch {
                    // ignore
                  }
                }
                const dotColor = colors[idx % colors.length]
                const category = m.skill_names && m.skill_names.length > 0 ? m.skill_names.join(', ') : 'Track Goal'
                return (
                  <div
                    key={m.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 9px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        textAlign: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ fontSize: 8.5, fontWeight: 800, color: '#4e5564', letterSpacing: '0.04em' }}>{dateMonth}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>{dateDay}</div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                        <div
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {m.name}
                        </div>
                      </div>
                      <div style={{ fontSize: 9.5, color: '#8e95a5', marginTop: 1, paddingLeft: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {category}
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>

        {/* 3. BOTTOM QUOTE */}
        <div className="flow-sidebar-quote">
          A better you is a series of small decisions. —
        </div>
      </aside>
    </div>
  )
}
