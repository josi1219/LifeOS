import { useState } from 'react'
import { Plus } from 'lucide-react'

export function JournalView() {
  const [entries, setEntries] = useState([
    {
      id: 1,
      title: 'Neural Networks & Deep Learning Foundations',
      date: 'Apr 16, 2025 • 8:17 PM',
      snippet: 'Today I spent 2 hours covering forward and backward propagation. Key takeaway: gradient descent intuition is straightforward once loss surface geometry clicks...',
      category: 'Machine Learning',
      timeSpent: '2h focused',
    },
    {
      id: 2,
      title: 'Vite Architecture & CSS Token Redesign',
      date: 'Apr 15, 2025 • 4:30 PM',
      snippet: 'Rethought the UI atmosphere. High contrast dark obsidian with emerald highlights feels significantly less cluttered than heavy bordered card grids...',
      category: 'Web Development',
      timeSpent: '1h 30m focused',
    },
    {
      id: 3,
      title: 'Weekly Systems Check & Time Audit',
      date: 'Apr 12, 2025 • 10:00 AM',
      snippet: 'Reviewed logged hours across all active skills. Reached 31% on Machine Learning target. Need to schedule earlier focus blocks to prevent evening fatigue...',
      category: 'Personal Development',
      timeSpent: '45m focused',
    },
  ])

  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [isComposing, setIsComposing] = useState(false)

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setEntries([
      {
        id: Date.now(),
        title: newTitle.trim(),
        date: 'Just now',
        snippet: newContent.trim() || 'No additional notes provided.',
        category: 'Focus Log',
        timeSpent: 'Manual Entry',
      },
      ...entries,
    ])
    setNewTitle('')
    setNewContent('')
    setIsComposing(false)
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Daily Journal & Logs
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
            Record insights, daily breakthroughs, and learning notes from your focus sessions.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => setIsComposing(!isComposing)}
          style={{ padding: '8px 18px', fontSize: 13, gap: 6 }}
        >
          <Plus size={15} />
          <span>New Entry</span>
        </button>
      </div>

      {isComposing && (
        <form onSubmit={handleAddEntry} className="card" style={{ padding: '20px', display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>New Log Entry</div>
          <input
            className="input"
            placeholder="Entry Title (e.g. What I learned today in Neural Networks...)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <textarea
            className="input"
            placeholder="Write your reflections, key concepts, or next actions..."
            rows={4}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsComposing(false)}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Save Entry
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="card"
            style={{
              padding: '20px 24px',
              display: 'grid',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                    background: 'rgba(0, 229, 153, 0.1)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {entry.category}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>{entry.date}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {entry.timeSpent}
              </span>
            </div>

            <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>{entry.title}</div>

            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {entry.snippet}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
