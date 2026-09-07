import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../../api/client'
import type {
  TimeSession,
  TimeSessionStartRequest,
  TimeSummaryResponse,
} from '../../api/types'

interface TimerContextValue {
  activeSession: TimeSession | null
  status: 'idle' | 'running' | 'paused'
  elapsedSeconds: number
  targetDurationSeconds: number
  setTargetDurationSeconds: (seconds: number) => void
  formattedTime: string
  summary: TimeSummaryResponse | null
  isLoading: boolean
  isStopModalOpen: boolean
  startTimer: (request?: TimeSessionStartRequest, targetSeconds?: number) => Promise<TimeSession>
  pauseTimer: () => Promise<void>
  resumeTimer: () => Promise<void>
  stopTimer: (note?: string, updateFocusNote?: boolean) => Promise<void>
  discardTimer: () => Promise<void>
  openStopModal: () => void
  closeStopModal: () => void
  refreshActive: () => Promise<void>
  refreshSummary: () => Promise<void>
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined)

function computeElapsed(session: TimeSession | null): number {
  if (!session) return 0
  const startMs = new Date(session.start_time).getTime()
  if (session.status === 'paused' && session.last_paused_at) {
    const pauseMs = new Date(session.last_paused_at).getTime()
    return Math.max(
      0,
      Math.floor((pauseMs - startMs) / 1000) - (session.pause_duration_seconds || 0)
    )
  }
  if (session.status === 'running') {
    return Math.max(
      0,
      Math.floor((Date.now() - startMs) / 1000) - (session.pause_duration_seconds || 0)
    )
  }
  return session.duration_seconds || 0
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)

  const pad = (n: number) => n.toString().padStart(2, '0')
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  }
  return `${pad(m)}:${pad(s)}`
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [targetDurationSeconds, setTargetDurationSecondsState] = useState<number>(() => {
    const saved = localStorage.getItem('lifeos_planned_focus_seconds')
    return saved ? parseInt(saved, 10) : 10800 // 3 hours default (10800s)
  })
  const [summary, setSummary] = useState<TimeSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isStopModalOpen, setIsStopModalOpen] = useState<boolean>(false)

  const setTargetDurationSeconds = useCallback((seconds: number) => {
    setTargetDurationSecondsState(seconds)
    localStorage.setItem('lifeos_planned_focus_seconds', seconds.toString())
  }, [])

  const refreshActive = useCallback(async () => {
    try {
      const data = await api.get<TimeSession | null>('/time-sessions/active')
      setActiveSession(data)
      setElapsedSeconds(computeElapsed(data))
    } catch {
      setActiveSession(null)
      setElapsedSeconds(0)
    }
  }, [])

  const refreshSummary = useCallback(async () => {
    try {
      const data = await api.get<TimeSummaryResponse>('/time-sessions/summary')
      setSummary(data)
    } catch {
      // ignore
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    let mounted = true
    Promise.all([refreshActive(), refreshSummary()]).finally(() => {
      if (mounted) setIsLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [refreshActive, refreshSummary])

  // Live ticking interval when session is running
  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0)
      return
    }

    // Immediately compute current
    setElapsedSeconds(computeElapsed(activeSession))

    if (activeSession.status !== 'running') {
      return
    }

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      setElapsedSeconds(computeElapsed(activeSession))
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSession])

  const startTimer = useCallback(
    async (request: TimeSessionStartRequest = {}, targetSeconds?: number) => {
      if (targetSeconds !== undefined && targetSeconds > 0) {
        setTargetDurationSeconds(targetSeconds)
      }
      const created = await api.post<TimeSession>('/time-sessions/start', request)
      setActiveSession(created)
      setElapsedSeconds(0)
      void refreshSummary()
      return created
    },
    [refreshSummary, setTargetDurationSeconds]
  )

  const pauseTimer = useCallback(async () => {
    if (!activeSession) return
    const paused = await api.post<TimeSession>(`/time-sessions/${activeSession.id}/pause`)
    setActiveSession(paused)
    setElapsedSeconds(computeElapsed(paused))
  }, [activeSession])

  const resumeTimer = useCallback(async () => {
    if (!activeSession) return
    const resumed = await api.post<TimeSession>(`/time-sessions/${activeSession.id}/resume`)
    setActiveSession(resumed)
    setElapsedSeconds(computeElapsed(resumed))
  }, [activeSession])

  const stopTimer = useCallback(
    async (note?: string, updateFocusNote: boolean = true) => {
      if (!activeSession) return
      await api.post<TimeSession>(`/time-sessions/${activeSession.id}/stop`, {
        note: note || null,
        update_focus_note: updateFocusNote,
      })
      setActiveSession(null)
      setElapsedSeconds(0)
      setIsStopModalOpen(false)
      await refreshSummary()
    },
    [activeSession, refreshSummary]
  )

  const discardTimer = useCallback(async () => {
    if (!activeSession) return
    await api.post<void>(`/time-sessions/${activeSession.id}/discard`)
    setActiveSession(null)
    setElapsedSeconds(0)
    setIsStopModalOpen(false)
    await refreshSummary()
  }, [activeSession, refreshSummary])

  const openStopModal = useCallback(() => {
    setIsStopModalOpen(true)
  }, [])

  const closeStopModal = useCallback(() => {
    setIsStopModalOpen(false)
  }, [])

  const status: 'idle' | 'running' | 'paused' = useMemo(() => {
    if (!activeSession) return 'idle'
    return activeSession.status === 'paused' ? 'paused' : 'running'
  }, [activeSession])

  const formattedTime = useMemo(
    () => formatDuration(elapsedSeconds),
    [elapsedSeconds]
  )

  const value = useMemo(
    () => ({
      activeSession,
      status,
      elapsedSeconds,
      targetDurationSeconds,
      setTargetDurationSeconds,
      formattedTime,
      summary,
      isLoading,
      isStopModalOpen,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      discardTimer,
      openStopModal,
      closeStopModal,
      refreshActive,
      refreshSummary,
    }),
    [
      activeSession,
      status,
      elapsedSeconds,
      targetDurationSeconds,
      setTargetDurationSeconds,
      formattedTime,
      summary,
      isLoading,
      isStopModalOpen,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      discardTimer,
      openStopModal,
      closeStopModal,
      refreshActive,
      refreshSummary,
    ]
  )

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider')
  }
  return context
}
