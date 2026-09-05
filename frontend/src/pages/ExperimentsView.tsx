import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Department, Experiment } from '../api/types'

export function ExperimentsView() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [purpose, setPurpose] = useState('')
  const [depId, setDepId] = useState<number | ''>('')
  const [timeBudget, setTimeBudget] = useState<number | ''>('')

  const [editingResultId, setEditingResultId] = useState<number | null>(null)
  const [resultText, setResultText] = useState('')
  const [promoteNotice, setPromoteNotice] = useState<string | null>(null)

  async function load() {
    setExperiments(await api.get<Experiment[]>('/experiments'))
    setDepartments(await api.get<Department[]>('/departments'))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await api.post('/experiments', {
      name: name.trim(),
      description: desc.trim() || null,
      purpose: purpose.trim() || null,
      department_id: depId || null,
      time_budget_hours: timeBudget === '' ? null : Number(timeBudget),
    })
    setName('')
    setDesc('')
    setPurpose('')
    setDepId('')
    setTimeBudget('')
    setAdding(false)
    await load()
  }

  async function handleTransition(expId: number, nextStatus: string) {
    await api.post(`/experiments/${expId}/status`, { status: nextStatus })
    if (nextStatus === 'promote') {
      setPromoteNotice(
        'Experiment marked as "Promoted"! Note: Creating the actual Roadmap Item is a separate, explicit manual action to keep your roadmap intentional. Navigate to your department\'s roadmap to add the item when ready.',
      )
    }
    await load()
  }

  async function handleSaveResult(expId: number) {
    await api.patch(`/experiments/${expId}`, { result: resultText.trim() || null })
    setEditingResultId(null)
    setResultText('')
    await load()
  }

  async function handleDelete(expId: number) {
    await api.delete(`/experiments/${expId}`)
    await load()
  }

  if (loading) return <div className="card">Loading experiments...</div>

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 840 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Experiments</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Low-risk sandboxes for testing ideas, frameworks, and strategies before committing them to your roadmap.
          </p>
        </div>
        <button className={adding ? '' : 'primary'} onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : '+ New Experiment'}
        </button>
      </div>

      {promoteNotice && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid var(--color-status-completed)',
            background: 'var(--color-surface-raised)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>{promoteNotice}</div>
          <button onClick={() => setPromoteNotice(null)} style={{ fontSize: 12 }}>
            Dismiss
          </button>
        </div>
      )}

      {adding && (
        <form onSubmit={handleCreate} className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            Experiment Name
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Test Bun vs Node.js runtime" />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            Hypothesis & Purpose
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What question are we trying to answer?"
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            Description / Methodology
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="How will we test this hypothesis?"
            />
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1 }}>
              Department (Optional)
              <select value={depId} onChange={(e) => setDepId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">None / General</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1 }}>
              Time Budget (Hours)
              <input
                type="number"
                step="0.5"
                value={timeBudget}
                onChange={(e) => setTimeBudget(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 5"
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="primary" type="submit">
              Launch Experiment
            </button>
            <button type="button" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {experiments.map((exp) => {
          const dep = departments.find((d) => d.id === exp.department_id)
          const isTerminal = exp.status === 'reject' || exp.status === 'promote'

          return (
            <div key={exp.id} className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{exp.name}</span>
                    {dep && (
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>({dep.name})</span>
                    )}
                  </div>
                  {exp.purpose && <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>{exp.purpose}</div>}
                  {exp.time_budget_hours && (
                    <div style={{ color: 'var(--color-text-faint)', fontSize: 12, marginTop: 2 }}>
                      Budget: {exp.time_budget_hours}h
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className={`status-badge status-${exp.status}`}>{exp.status}</span>
                  <button onClick={() => handleDelete(exp.id)} style={{ fontSize: 12, padding: '2px 6px' }}>
                    Delete
                  </button>
                </div>
              </div>

              {/* Status transition action buttons */}
              {!isTerminal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13, marginTop: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Transition:</span>
                  {exp.status !== 'continue' && (
                    <button onClick={() => handleTransition(exp.id, 'continue')} style={{ fontSize: 12 }}>
                      Continue
                    </button>
                  )}
                  {exp.status !== 'pause' && (
                    <button onClick={() => handleTransition(exp.id, 'pause')} style={{ fontSize: 12 }}>
                      Pause
                    </button>
                  )}
                  <button onClick={() => handleTransition(exp.id, 'reject')} style={{ fontSize: 12 }}>
                    Reject ✕
                  </button>
                  <button className="primary" onClick={() => handleTransition(exp.id, 'promote')} style={{ fontSize: 12 }}>
                    Promote ★
                  </button>
                </div>
              )}

              {/* Result / Learnings */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Learnings & Outcome:</strong>
                  {editingResultId !== exp.id && (
                    <button
                      onClick={() => {
                        setEditingResultId(exp.id)
                        setResultText(exp.result ?? '')
                      }}
                      style={{ fontSize: 11, padding: '2px 6px' }}
                    >
                      {exp.result ? 'Edit Learnings' : '+ Add Learnings'}
                    </button>
                  )}
                </div>

                {editingResultId === exp.id ? (
                  <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                    <textarea
                      rows={3}
                      value={resultText}
                      onChange={(e) => setResultText(e.target.value)}
                      placeholder="What was learned from this experiment? Did it validate or invalidate the hypothesis?"
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="primary" onClick={() => handleSaveResult(exp.id)} style={{ fontSize: 12 }}>
                        Save
                      </button>
                      <button onClick={() => setEditingResultId(null)} style={{ fontSize: 12 }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: exp.result ? 'var(--color-text)' : 'var(--color-text-faint)', marginTop: 4 }}>
                    {exp.result ?? 'No learnings recorded yet.'}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {experiments.length === 0 && !adding && (
          <div className="card" style={{ color: 'var(--color-text-muted)' }}>
            No experiments yet. Click "+ New Experiment" to test new ideas with zero risk.
          </div>
        )}
      </div>
    </div>
  )
}
