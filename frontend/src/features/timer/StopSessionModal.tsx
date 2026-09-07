import { useState, useEffect } from 'react'
import { CheckCircle2, Trash2, X } from 'lucide-react'
import { useTimer } from './TimerContext'

export function StopSessionModal() {
  const {
    activeSession,
    formattedTime,
    isStopModalOpen,
    closeStopModal,
    stopTimer,
    discardTimer,
  } = useTimer()

  const [note, setNote] = useState('')
  const [updateFocusNote, setUpdateFocusNote] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (activeSession) {
      setNote(activeSession.note || '')
    }
  }, [activeSession])

  if (!isStopModalOpen || !activeSession) return null

  const entityName =
    activeSession.roadmap_item_name ||
    activeSession.task_name ||
    activeSession.goal_name ||
    activeSession.department_name ||
    'General Focus'

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await stopTimer(note, updateFocusNote)
    } finally {
      setSubmitting(false)
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
          maxWidth: 480,
          background: 'var(--color-bg-alt)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Log Focus Session</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-faint)' }}>
                Lock in your progress and update your mission
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeStopModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-faint)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-4)' }}>
          {/* Duration + Entity Summary Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>
                FOCUSED ON
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)', marginTop: 2 }}>
                {entityName}
              </div>
              {activeSession.department_name && (
                <div style={{ fontSize: 11, color: 'var(--color-accent-text)', marginTop: 2 }}>
                  {activeSession.department_name}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>
                SESSION TIME
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#10b981',
                  marginTop: 2,
                }}
              >
                {formattedTime}
              </div>
            </div>
          </div>

          {/* Accomplishment Note */}
          <div>
            <label
              htmlFor="accomplishment-note"
              style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--color-text)' }}
            >
              What did you accomplish?
            </label>
            <textarea
              id="accomplishment-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Completed JWT refresh token rotation, fixed edge cases in test matrix..."
              rows={3}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text)',
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
              autoFocus
            />
          </div>

          {/* Focus Note Update Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={updateFocusNote}
              onChange={(e) => setUpdateFocusNote(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--color-accent)' }}
            />
            <span>Update my Mission Control focus note with this accomplishment</span>
          </label>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'var(--space-2)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Discard this session without logging hours?')) {
                  void discardTimer()
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: 12,
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <Trash2 size={13} />
              <span>Discard</span>
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeStopModal}
                disabled={submitting}
                style={{ fontSize: 13 }}
              >
                Keep Focusing
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                }}
              >
                <CheckCircle2 size={15} />
                <span>{submitting ? 'Saving...' : 'Save & Log Session'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
