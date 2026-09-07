import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimer } from '../features/timer/TimerContext'
import './FocusMode.css'

export function FocusMode() {
  const navigate = useNavigate()
  const {
    activeSession,
    status,
    elapsedSeconds,
    pauseTimer,
    resumeTimer,
  } = useTimer()

  // Real-time live clock (e.g. 09:42 PM)
  const [currentTime, setCurrentTime] = useState(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Local fallback timer when no backend session is active (e.g. previewing focus mode)
  // 02:17:36 = 2*3600 + 17*60 + 36 = 8256 seconds
  const [localRemaining, setLocalRemaining] = useState(8256)
  const [localPaused, setLocalPaused] = useState(false)

  const isPaused = activeSession ? status === 'paused' : localPaused

  // Local countdown ticker when unattached to backend session
  useEffect(() => {
    if (activeSession) return
    if (localPaused) return

    const interval = setInterval(() => {
      setLocalRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeSession, localPaused])

  // Total session target duration (default: 3 hours = 10,800s)
  const targetSeconds = activeSession?.duration_seconds || 3 * 3600

  // Calculate actual remaining seconds
  const remainingSeconds = useMemo(() => {
    if (activeSession) {
      return Math.max(0, targetSeconds - elapsedSeconds)
    }
    return localRemaining
  }, [activeSession, targetSeconds, elapsedSeconds, localRemaining])

  // Progress fraction (0 to 1)
  const progress = useMemo(() => {
    const p = (targetSeconds - remainingSeconds) / targetSeconds
    return Math.min(1, Math.max(0, p))
  }, [targetSeconds, remainingSeconds])

  // Format seconds to HH:MM:SS (e.g. 02:17:36)
  const formattedRemaining = useMemo(() => {
    const hrs = Math.floor(remainingSeconds / 3600).toString().padStart(2, '0')
    const mins = Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, '0')
    const secs = (remainingSeconds % 60).toString().padStart(2, '0')
    return `${hrs}:${mins}:${secs}`
  }, [remainingSeconds])

  // Toggle pause / resume
  const togglePause = useCallback(async () => {
    if (activeSession) {
      if (status === 'running') {
        await pauseTimer()
      } else if (status === 'paused') {
        await resumeTimer()
      }
    } else {
      setLocalPaused((prev) => !prev)
    }
  }, [activeSession, status, pauseTimer, resumeTimer])

  // Keyboard navigation: Escape exits to Dashboard, Space toggles pause/resume
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/')
      } else if (e.code === 'Space') {
        e.preventDefault()
        togglePause()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, togglePause])

  // Circular Dial Geometry
  const size = 360
  const center = size / 2
  const radius = 152
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  // Glowing beacon dot at leading edge of arc
  const arcAngle = -90 + progress * 360
  const arcAngleRad = (arcAngle * Math.PI) / 180
  const headX = center + radius * Math.cos(arcAngleRad)
  const headY = center + radius * Math.sin(arcAngleRad)

  // Display skill & sub-skill name
  const skillName = activeSession?.skill_name || 'Machine Learning'
  const subSkillName = activeSession?.roadmap_item_name || activeSession?.note || 'Feature Engineering'

  return (
    <div className="flow-focus-screen">
      {/* 1. Mountain Moonscape Photographic Backdrop */}
      <div className="flow-focus-mountains" />
      <div className="flow-focus-mountains-overlay" />

      {/* 2. Top Minimal Header */}
      <header className="flow-focus-header">
        {/* Left: Brand Logo (Click to exit) */}
        <div
          className="flow-focus-brand"
          onClick={() => navigate('/')}
          title="Exit Focus Mode (Esc)"
        >
          <div className="flow-focus-brand-logo">
            {/* 4-point Star Logo */}
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path
                d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </svg>
            <span>Flow</span>
          </div>
          <span className="flow-focus-brand-motto">
            Discipline builds the freedom you want.
          </span>
        </div>

        {/* Right: Live Status Indicator & Current Time */}
        <div className="flow-focus-status-bar">
          <div className="flow-focus-indicator">
            <span className={`flow-focus-dot ${isPaused ? 'paused' : ''}`} />
            <span style={{ color: isPaused ? '#f59e0b' : '#94a3b8', fontWeight: 500 }}>
              {isPaused ? 'Paused' : 'Focus Mode'}
            </span>
          </div>
          <span className="flow-focus-clock">{currentTime}</span>
        </div>
      </header>

      {/* 3. Center Focus Stage & Dial */}
      <main className="flow-focus-center">
        <div className="flow-focus-subtitle">FOCUSING ON</div>
        <h1 className="flow-focus-title">{skillName}</h1>

        <div className="flow-focus-subskill">
          <span className="flow-focus-subskill-dot" />
          <span>{subSkillName}</span>
        </div>

        {/* Glowing Dial Countdown */}
        <div
          className="flow-focus-dial-container"
          onClick={togglePause}
          title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
        >
          <svg className="flow-focus-dial-svg" viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <linearGradient id="focusProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4f8cff" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <filter id="beaconGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Track Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#151c2a"
              strokeWidth="2.5"
              fill="none"
            />

            {/* Glowing Active Progress Arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="url(#focusProgressGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${center} ${center})`}
              style={{
                transition: 'stroke-dashoffset 0.4s ease',
              }}
            />

            {/* Leading Edge Beacon Head */}
            {progress > 0.01 && (
              <circle
                cx={headX}
                cy={headY}
                r="4.2"
                fill="#e0e7ff"
                filter="url(#beaconGlow)"
              />
            )}
          </svg>

          {/* Time Digits & Remaining Label inside Circle */}
          <div className="flow-focus-time-display">
            <div className="flow-focus-digits">{formattedRemaining}</div>
            <div className="flow-focus-remaining-label">REMAINING</div>
          </div>
        </div>

        {/* Quote & Divider */}
        <div className="flow-focus-quote-section">
          <div className="flow-focus-quote">
            "Small steps every day lead to big results."
          </div>
          <div className="flow-focus-divider" />
        </div>
      </main>

      {/* Empty footer spacer ensuring balanced flex vertical layout */}
      <div style={{ height: 20, pointerEvents: 'none' }} />
    </div>
  )
}
