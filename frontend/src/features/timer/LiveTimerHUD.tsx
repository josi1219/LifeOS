import { Pause, Play, Square, Trash2 } from 'lucide-react'
import { useTimer } from './TimerContext'

export function LiveTimerHUD() {
  const {
    activeSession,
    status,
    formattedTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    openStopModal,
    discardTimer,
  } = useTimer()

  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={() => startTimer()}
        title="Start quick focus session"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-full)',
          padding: '5px 12px',
          color: 'var(--color-text-muted)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-accent)'
          e.currentTarget.style.color = '#ffffff'
          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.color = 'var(--color-text-muted)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
        }}
      >
        <Play size={12} fill="currentColor" />
        <span>Start Timer</span>
      </button>
    )
  }

  const isPaused = status === 'paused'
  const entityLabel =
    activeSession?.roadmap_item_name ||
    activeSession?.task_name ||
    activeSession?.goal_name ||
    activeSession?.department_name ||
    activeSession?.note ||
    'Deep Work'

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        background: isPaused ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.12)',
        border: `1px solid ${isPaused ? 'rgba(245, 158, 11, 0.35)' : 'rgba(99, 102, 241, 0.4)'}`,
        borderRadius: 'var(--radius-full)',
        padding: '4px 8px 4px 14px',
        boxShadow: isPaused
          ? '0 0 16px rgba(245, 158, 11, 0.15)'
          : '0 0 16px rgba(99, 102, 241, 0.2)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Pulsing indicator + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isPaused ? '#f59e0b' : '#10b981',
            boxShadow: isPaused ? '0 0 8px #f59e0b' : '0 0 8px #10b981',
            display: 'inline-block',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 160 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.1,
            }}
            title={entityLabel}
          >
            {entityLabel}
          </span>
          <span style={{ fontSize: 9, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {isPaused ? 'PAUSED' : 'FOCUSING'}
          </span>
        </div>
      </div>

      {/* Ticking Digital Time Display */}
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 15,
          fontWeight: 700,
          color: isPaused ? '#f59e0b' : '#ffffff',
          letterSpacing: '0.04em',
          padding: '2px 8px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {formattedTime}
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {isPaused ? (
          <button
            type="button"
            onClick={resumeTimer}
            title="Resume timer"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.1s ease',
            }}
          >
            <Play size={13} fill="#ffffff" style={{ marginLeft: 1 }} />
          </button>
        ) : (
          <button
            type="button"
            onClick={pauseTimer}
            title="Pause timer"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
          >
            <Pause size={13} />
          </button>
        )}

        <button
          type="button"
          onClick={openStopModal}
          title="Stop & log session"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef4444'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
            e.currentTarget.style.color = '#ef4444'
          }}
        >
          <Square size={12} fill="currentColor" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Discard current focus timer without saving?')) {
              void discardTimer()
            }
          }}
          title="Discard session"
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-faint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
