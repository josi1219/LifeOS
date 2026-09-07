import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
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
  Target,
  Zap,
} from 'lucide-react'
import { useTimer } from '../features/timer/TimerContext'
import './Dashboard.css'

export function Dashboard() {
  const navigate = useNavigate()
  const { startTimer } = useTimer()

  // Selected Skill and Sub-Skill state
  const [selectedSkill, setSelectedSkill] = useState('Machine Learning')
  const [selectedSubSkill, setSelectedSubSkill] = useState('Neural Networks')
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false)
  const [isSubSkillDropdownOpen, setIsSubSkillDropdownOpen] = useState(false)
  const [overviewRange, setOverviewRange] = useState('Last 30 days')
  const [isOverviewDropdownOpen, setIsOverviewDropdownOpen] = useState(false)

  const skillsList = [
    { id: 'ml', name: 'Machine Learning', subSkills: ['Neural Networks', 'Python Basics', 'PyTorch', 'Data Preprocessing'] },
    { id: 'web', name: 'Web Development', subSkills: ['Frontend Architecture', 'React & Vite', 'FastAPI', 'PostgreSQL'] },
    { id: 'ds', name: 'Data Science', subSkills: ['Exploratory Data Analysis', 'Pandas & NumPy', 'Data Visualization'] },
    { id: 'pd', name: 'Personal Development', subSkills: ['Deep Work Habits', 'Review & Reflect', 'Time Allocation'] },
  ]

  const activeSkillObj = skillsList.find((s) => s.name === selectedSkill) || skillsList[0]

  const handleStartFocus = async () => {
    try {
      await startTimer({ note: `Focusing on ${selectedSkill} - ${selectedSubSkill}` })
    } catch {
      // ignore
    }
    navigate('/focus')
  }

  // Circular gauge calculations for Progress Overview
  const progressPercent = 42
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

  // Calendar dates setup (April 2025 starts on Tuesday, Day 1 is under Tue)
  const daysInApril = Array.from({ length: 30 }, (_, i) => i + 1)
  
  const calendarMarkers: Record<number, { type: 'milestone-ring' | 'deadline-ring' | 'active-milestone' | 'active-deadline' | 'dot-only', color: string }> = {
    8: { type: 'dot-only', color: '#00e599' },
    10: { type: 'deadline-ring', color: '#8b5cf6' },
    15: { type: 'milestone-ring', color: '#00e599' },
    18: { type: 'active-milestone', color: '#00e599' },
    22: { type: 'deadline-ring', color: '#8b5cf6' },
    25: { type: 'active-deadline', color: '#8b5cf6' },
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
              Complete Machine Learning Basics
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
              <span>Due in 12 days</span>
              <span style={{ color: '#4e5564' }}>•</span>
              <span>3/5 skills completed</span>
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
                    width: '60%',
                    height: '100%',
                    background: '#00e599',
                    borderRadius: 2.5,
                  }}
                />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#ffffff' }}>60%</span>
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
                  style={{
                    position: 'relative',
                    width: timerDialSize,
                    height: timerDialSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width={timerDialSize} height={timerDialSize} style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx={timerDialSize / 2}
                      cy={timerDialSize / 2}
                      r={timerRadius}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth={timerStroke}
                      fill="none"
                    />
                    <circle
                      cx={timerDialSize / 2}
                      cy={timerDialSize / 2}
                      r={timerRadius}
                      stroke="#00e599"
                      strokeWidth={timerStroke}
                      fill="none"
                      strokeDasharray={timerCircumference}
                      strokeDashoffset={timerCircumference * 0.25}
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(0, 229, 153, 0.4))' }}
                    />
                  </svg>

                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 17,
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      03:00:00
                    </div>
                    <div style={{ fontSize: 9.5, color: '#8e95a5', marginTop: 1 }}>
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
                    Select Skill
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Brain size={13} color="#8b5cf6" />
                      <span>{selectedSkill}</span>
                    </div>
                    <ChevronDown size={12} color="#4e5564" />
                  </button>

                  {isSkillDropdownOpen && (
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
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      {skillsList.map((skill) => (
                        <div
                          key={skill.id}
                          onClick={() => {
                            setSelectedSkill(skill.name)
                            setSelectedSubSkill(skill.subSkills[0])
                            setIsSkillDropdownOpen(false)
                          }}
                          style={{
                            padding: '7px 10px',
                            fontSize: 11.5,
                            color: skill.name === selectedSkill ? '#00e599' : '#ffffff',
                            cursor: 'pointer',
                            background: skill.name === selectedSkill ? 'rgba(0, 229, 153, 0.08)' : 'transparent',
                          }}
                        >
                          {skill.name}
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
                    onClick={() => setIsSubSkillDropdownOpen(!isSubSkillDropdownOpen)}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Zap size={13} color="#8b5cf6" />
                      <span>{selectedSubSkill}</span>
                    </div>
                    <ChevronDown size={12} color="#4e5564" />
                  </button>

                  {isSubSkillDropdownOpen && (
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
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      {activeSkillObj.subSkills.map((sub) => (
                        <div
                          key={sub}
                          onClick={() => {
                            setSelectedSubSkill(sub)
                            setIsSubSkillDropdownOpen(false)
                          }}
                          style={{
                            padding: '7px 10px',
                            fontSize: 11.5,
                            color: sub === selectedSubSkill ? '#8b5cf6' : '#ffffff',
                            cursor: 'pointer',
                            background: sub === selectedSubSkill ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                          }}
                        >
                          {sub}
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
                      3h 0m
                    </div>
                    <div style={{ height: 2.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, marginTop: 3, overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', background: '#00e599' }} />
                    </div>
                  </div>

                  {/* Completed Today */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>
                      <CheckSquare size={9} />
                      <span>Completed</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', marginTop: 1 }}>
                      0h 0m
                    </div>
                    <div style={{ height: 2.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, marginTop: 3, overflow: 'hidden' }}>
                      <div style={{ width: '0%', height: '100%', background: '#00e599' }} />
                    </div>
                  </div>

                  {/* Total Progress */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>
                      <CheckCircle2 size={9} />
                      <span>Total Progress</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>12h 30m / 40h</span>
                      <span style={{ fontSize: 9.5, color: '#8e95a5' }}>• 31%</span>
                    </div>
                    <div style={{ height: 2.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, marginTop: 3, overflow: 'hidden' }}>
                      <div style={{ width: '31%', height: '100%', background: '#00e599' }} />
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
                    42%
                  </div>
                  <div style={{ fontSize: 9.5, color: '#8e95a5', marginTop: 2 }}>
                    Overall Progress
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Progress Breakdown List */}
            <div style={{ display: 'grid', gap: 7 }}>
              {[
                { name: 'Machine Learning', hours: '12h 30m / 40h', pct: 31, icon: Brain, color: '#8b5cf6' },
                { name: 'Web Development', hours: '8h 15m / 30h', pct: 27, icon: Globe, color: '#38bdf8' },
                { name: 'Data Science', hours: '6h 45m / 25h', pct: 26, icon: LineChart, color: '#00e599' },
                { name: 'Personal Development', hours: '4h 20m / 20h', pct: 21, icon: Clock, color: '#f59e0b' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.name} style={{ display: 'grid', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
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
                          }}
                        >
                          <Icon size={11} />
                        </div>
                        <span style={{ color: '#ffffff', fontWeight: 500 }}>{item.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#8e95a5', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                          {item.hours}
                        </span>
                        <span style={{ color: '#8e95a5', fontSize: 10, fontWeight: 600, minWidth: 22, textAlign: 'right' }}>
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
              })}
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
              {[
                { title: 'Become a Machine Learning Engineer', skills: '3/5 skills completed', pct: 60, icon: Brain, badgeBg: '#8b5cf6' },
                { title: 'Build a Web Application', skills: '2/6 skills completed', pct: 33, icon: Code, badgeBg: '#00e599' },
                { title: 'Improve Physical Health', skills: '1/5 skills completed', pct: 20, icon: Heart, badgeBg: '#f43f5e' },
              ].map((goal) => {
                const Icon = goal.icon
                return (
                  <div
                    key={goal.title}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 'var(--radius-sm)',
                          background: `${goal.badgeBg}18`,
                          color: goal.badgeBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#ffffff', lineHeight: 1.2 }}>{goal.title}</div>
                        <div style={{ fontSize: 9.5, color: '#4e5564', marginTop: 1 }}>
                          {goal.skills}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <div style={{ width: 56, height: 3.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${goal.pct}%`, height: '100%', background: '#00e599' }} />
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#8e95a5', minWidth: 24, textAlign: 'right' }}>
                        {goal.pct}%
                      </span>
                      <ChevronRight size={12} color="#4e5564" />
                    </div>
                  </div>
                )
              })}
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
              {[
                { title: 'Completed 1h of Neural Networks', date: 'Apr 18, 2025 • 3:42 PM', dotColor: '#00e599' },
                { title: 'Added new milestone', subtitle: 'Finish Python Basics by Apr 25, 2025', date: 'Apr 17, 2025 • 10:21 AM', dotColor: '#8b5cf6' },
                { title: 'Journal Entry', subtitle: 'What I learned today and next steps...', date: 'Apr 16, 2025 • 8:17 PM', dotColor: '#f43f5e' },
                { title: 'Completed 2h of Web Development', date: 'Apr 16, 2025 • 4:03 PM', dotColor: '#00e599' },
              ].map((act, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: act.dotColor,
                      marginTop: 4,
                      flexShrink: 0,
                      boxShadow: `0 0 5px ${act.dotColor}80`,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, color: '#ffffff', fontWeight: 500, lineHeight: 1.25 }}>
                      {act.title}
                    </div>
                    {act.subtitle && (
                      <div style={{ fontSize: 10.5, color: '#8e95a5', marginTop: 1 }}>
                        {act.subtitle}
                      </div>
                    )}
                    <div style={{ fontSize: 9.5, color: '#4e5564', marginTop: 1 }}>
                      {act.date}
                    </div>
                  </div>
                </div>
              ))}
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
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#8e95a5' }}>April 2025</span>
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', padding: 2, color: '#4e5564', cursor: 'pointer' }}
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
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

          {/* Day Numbers Grid (April 2025 starts on Tuesday) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px 1px',
              textAlign: 'center',
              fontSize: 10.5,
            }}
          >
            {/* March padding days */}
            <div style={{ color: 'rgba(255, 255, 255, 0.08)', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>30</div>
            <div style={{ color: 'rgba(255, 255, 255, 0.08)', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>31</div>

            {daysInApril.map((day) => {
              const marker = calendarMarkers[day]
              const isDotOnly = marker?.type === 'dot-only'
              const isMilestoneRing = marker?.type === 'milestone-ring'
              const isDeadlineRing = marker?.type === 'deadline-ring'
              const isActiveMilestone = marker?.type === 'active-milestone'
              const isActiveDeadline = marker?.type === 'active-deadline'

              let bg = 'transparent'
              let color = '#8e95a5'
              let border = '1px solid transparent'

              if (isActiveMilestone) {
                bg = '#00e599'
                color = '#080b11'
              } else if (isActiveDeadline) {
                bg = '#8b5cf6'
                color = '#ffffff'
              } else if (isMilestoneRing) {
                border = '1px solid #00e599'
                color = '#00e599'
              } else if (isDeadlineRing) {
                border = '1px solid #8b5cf6'
                color = '#8b5cf6'
              } else if (isDotOnly) {
                color = '#ffffff'
              }

              return (
                <div
                  key={day}
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
                      fontWeight: marker ? 700 : 500,
                      fontSize: 10.5,
                      lineHeight: 1,
                    }}
                  >
                    {day}
                  </div>
                  {/* Indicator dot beneath marked dates */}
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
            {[
              { dateMonth: 'APR', dateDay: '25', title: 'Finish Python Basics', category: 'Machine Learning', dotColor: '#00e599' },
              { dateMonth: 'APR', dateDay: '30', title: 'Build Portfolio Website', category: 'Web Development', dotColor: '#00e599' },
              { dateMonth: 'MAY', dateDay: '10', title: 'Complete Data Analysis Project', category: 'Data Science', dotColor: '#8b5cf6' },
              { dateMonth: 'MAY', dateDay: '20', title: 'Review and Reflect', category: 'Personal Development', dotColor: '#f59e0b' },
            ].map((m, idx) => (
              <div
                key={idx}
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
                  <div style={{ fontSize: 8.5, fontWeight: 800, color: '#4e5564', letterSpacing: '0.04em' }}>{m.dateMonth}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>{m.dateDay}</div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dotColor, flexShrink: 0 }} />
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
                      {m.title}
                    </div>
                  </div>
                  <div style={{ fontSize: 9.5, color: '#8e95a5', marginTop: 1, paddingLeft: 10 }}>
                    {m.category}
                  </div>
                </div>
              </div>
            ))}
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
