import { useEffect, useState, type FormEvent } from 'react'
import {
  Clock,
  FlaskConical,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
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
        '★ Experiment Promoted! Remember: Creating the actual Roadmap Node is a separate, explicit manual action on your roadmap to keep your execution architecture intentional.',
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

  if (loading) return <div className="card">Loading experiments laboratory...</div>

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-cyan-subtle)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-cyan)',
              }}
            >
              <FlaskConical size={18} />
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Experiments Laboratory</h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0', fontSize: 13 }}>
            Low-risk hypothesis sandboxes. Test tools and strategies with explicit time budgets before committing them to roadmaps.
          </p>
        </div>
        <button className="primary" onClick={() => setAdding(!adding)} style={{ fontSize: 13 }}>
          <Plus size={14} />
          {adding ? 'Cancel' : 'New Experiment'}
        </button>
      </div>

      {promoteNotice && (
        <div
          className="card card-glow"
          style={{
            borderLeft: '4px solid var(--color-emerald)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
          }}
        >
          <div>{promoteNotice}</div>
          <button onClick={() => setPromoteNotice(null)} style={{ fontSize: 11, padding: '3px 8px' }}>
            Dismiss
          </button>
        </div>
      )}

      {adding && (
        <form onSubmit={handleCreate} className="card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <label style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 13, fontWeight: 600 }}>
            Experiment Name
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bun vs Node.js for backend microservices" />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 13, fontWeight: 600 }}>
            Hypothesis & Purpose
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What question are you answering? What is the expected outcome?"
            />
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1, fontSize: 12 }}>
              Department (Optional)
              <select value={depId} onChange={(e) => setDepId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">General Exploration</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1, fontSize: 12 }}>
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
            <div key={exp.id} className="card" style={{ display: 'grid', gap: 'var(--space-3)', background: 'var(--color-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 17, color: '#ffffff' }}>{exp.name}</span>
                    {dep && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                        {dep.name}
                      </span>
                    )}
                  </div>
                  {exp.purpose && <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>{exp.purpose}</p>}
                  {exp.time_budget_hours && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-faint)', fontSize: 12, marginTop: 4 }}>
                      <Clock size={12} /> Budget: {exp.time_budget_hours}h
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className={`status-badge status-${exp.status}`}>{exp.status}</span>
                  <button onClick={() => handleDelete(exp.id)} style={{ padding: '4px 8px', fontSize: 11 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Status transitions */}
              {!isTerminal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 12, borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-text-faint)' }}>State Transition:</span>
                  {exp.status !== 'continue' && (
                    <button onClick={() => handleTransition(exp.id, 'continue')} style={{ fontSize: 11, padding: '3px 8px' }}>
                      <Play size={11} /> Continue
                    </button>
                  )}
                  {exp.status !== 'pause' && (
                    <button onClick={() => handleTransition(exp.id, 'pause')} style={{ fontSize: 11, padding: '3px 8px' }}>
                      <Pause size={11} /> Pause
                    </button>
                  )}
                  <button onClick={() => handleTransition(exp.id, 'reject')} style={{ fontSize: 11, padding: '3px 8px', color: 'var(--color-rose)' }}>
                    <X size={11} /> Reject
                  </button>
                  <button className="primary" onClick={() => handleTransition(exp.id, 'promote')} style={{ fontSize: 11, padding: '3px 10px' }}>
                    <Sparkles size={11} /> Promote ★
                  </button>
                </div>
              )}

              {/* Result / Learnings */}
              <div style={{ background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Learnings & Evidence:
                  </strong>
                  {editingResultId !== exp.id && (
                    <button
                      onClick={() => {
                        setEditingResultId(exp.id)
                        setResultText(exp.result ?? '')
                      }}
                      style={{ fontSize: 11, padding: '2px 8px', background: 'transparent' }}
                    >
                      {exp.result ? 'Edit Learnings' : '+ Log Learnings'}
                    </button>
                  )}
                </div>

                {editingResultId === exp.id ? (
                  <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                    <textarea
                      rows={3}
                      value={resultText}
                      onChange={(e) => setResultText(e.target.value)}
                      placeholder="What was observed? Was the hypothesis proven or disproven?"
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
                  <div style={{ color: exp.result ? '#ffffff' : 'var(--color-text-faint)', fontSize: 13, marginTop: 4 }}>
                    {exp.result ?? 'No observations logged yet.'}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {experiments.length === 0 && !adding && (
          <div className="card" style={{ color: 'var(--color-text-faint)', textAlign: 'center', padding: 'var(--space-5)' }}>
            No experiments underway. Click "New Experiment" to test hypotheses without cluttering roadmaps.
          </div>
        )}
      </div>
    </div>
  )
}
