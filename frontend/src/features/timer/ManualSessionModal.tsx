import { useState, useEffect } from 'react'
import { Clock, X } from 'lucide-react'
import { api } from '../../api/client'
import type { Department, TimeSession } from '../../api/types'
import { useTimer } from './TimerContext'

interface ManualSessionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ManualSessionModal({ isOpen, onClose }: ManualSessionModalProps) {
  const { refreshSummary } = useTimer()
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      void api.get<Department[]>('/departments').then((deps) => {
        setDepartments(deps)
        if (deps.length > 0 && !departmentId) {
          setDepartmentId(deps[0].id)
        }
      })

      // Default start 1 hour ago, end now
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      const toLocalISO = (d: Date) => {
        const offset = d.getTimezoneOffset() * 60000
        return new Date(d.getTime() - offset).toISOString().slice(0, 16)
      }

      setStartTime(toLocalISO(oneHourAgo))
      setEndTime(toLocalISO(now))
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startTime || !endTime) {
      setError('Start time and end time are required')
      return
    }

    const startIso = new Date(startTime).toISOString()
    const endIso = new Date(endTime).toISOString()

    if (new Date(endIso) <= new Date(startIso)) {
      setError('End time must be after start time')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await api.post<TimeSession>('/time-sessions/manual', {
        start_time: startIso,
        end_time: endIso,
        department_id: departmentId ? Number(departmentId) : null,
        note: note || null,
      })
      await refreshSummary()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log manual session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 10, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-4)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--color-bg-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="var(--color-accent-text)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Log Past Time</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-faint)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-4)' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Department
            </label>
            <select
              className="input"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">None / General</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Start Time
              </label>
              <input
                type="datetime-local"
                className="input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                End Time
              </label>
              <input
                type="datetime-local"
                className="input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Activity / Accomplishment Note
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Read Chapter 4 of Systems Architecture"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 'var(--space-2)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging...' : 'Log Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
