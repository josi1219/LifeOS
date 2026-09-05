import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Milestone, Project, Skill } from '../api/types'

export function MilestonesView({ departmentId }: { departmentId: number }) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const [addingMilestone, setAddingMilestone] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [criteria, setCriteria] = useState('')
  const [completionDate, setCompletionDate] = useState('')

  async function load() {
    const list = await api.get<Milestone[]>(`/departments/${departmentId}/milestones`)
    setMilestones(list)
    setSkills(await api.get<Skill[]>(`/departments/${departmentId}/skills`))
    setProjects(await api.get<Project[]>(`/departments/${departmentId}/projects`))
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await api.post(`/departments/${departmentId}/milestones`, {
      name: name.trim(),
      description: desc.trim() || null,
      completion_criteria: criteria.trim() || null,
      completion_date: completionDate || null,
    })
    setName('')
    setDesc('')
    setCriteria('')
    setCompletionDate('')
    setAddingMilestone(false)
    await load()
  }

  async function handleUpdate(milestoneId: number, updates: Partial<Milestone>) {
    await api.patch(`/milestones/${milestoneId}`, updates)
    await load()
  }

  async function handleDelete(milestoneId: number) {
    await api.delete(`/milestones/${milestoneId}`)
    await load()
  }

  async function handleLinkSkill(milestoneId: number, skillId: number) {
    await api.post(`/milestones/${milestoneId}/skills/${skillId}`)
    await load()
  }

  async function handleLinkProject(milestoneId: number, projectId: number) {
    await api.post(`/milestones/${milestoneId}/projects/${projectId}`)
    await load()
  }

  if (loading) return <div className="card">Loading milestones...</div>

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Milestones</h2>
        <button className={addingMilestone ? '' : 'primary'} onClick={() => setAddingMilestone(!addingMilestone)}>
          {addingMilestone ? 'Cancel' : '+ Add Milestone'}
        </button>
      </div>

      {addingMilestone && (
        <form onSubmit={handleCreate} className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            Milestone Name
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production Release v1" />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            Description
            <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Overview of what this milestone represents..." />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            Completion Criteria (Definition of Done)
            <textarea rows={2} value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder="Explicit criteria required to mark as completed..." />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            Target Completion Date
            <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="primary" type="submit">
              Create Milestone
            </button>
            <button type="button" onClick={() => setAddingMilestone(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {milestones.map((m) => (
          <div key={m.id} className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{m.name}</div>
                {m.description && <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{m.description}</div>}
                {m.completion_criteria && (
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    <strong>Criteria:</strong> {m.completion_criteria}
                  </div>
                )}
                {m.completion_date && (
                  <div style={{ color: 'var(--color-text-faint)', fontSize: 12, marginTop: 2 }}>
                    Target: {new Date(m.completion_date).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className={`status-badge status-${m.status}`}>{m.status}</span>
                <select
                  value={m.status}
                  onChange={(e) =>
                    handleUpdate(m.id, {
                      status: e.target.value,
                      progress: e.target.value === 'completed' ? 100 : m.progress,
                    })
                  }
                  style={{ fontSize: 12, padding: '2px 4px' }}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => handleDelete(m.id)} style={{ fontSize: 12, padding: '2px 6px' }}>
                  Delete
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 12 }}>
              <span>Progress: {m.progress}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={m.progress}
                onChange={(e) => handleUpdate(m.id, { progress: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
            </div>

            {/* Link Skills or Projects */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', fontSize: 12, display: 'flex', gap: 'var(--space-3)' }}>
              {skills.length > 0 && (
                <div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleLinkSkill(m.id, Number(e.target.value))
                    }}
                    defaultValue=""
                    style={{ fontSize: 11 }}
                  >
                    <option value="" disabled>+ Link Skill</option>
                    {skills.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {projects.length > 0 && (
                <div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleLinkProject(m.id, Number(e.target.value))
                    }}
                    defaultValue=""
                    style={{ fontSize: 11 }}
                  >
                    <option value="" disabled>+ Link Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}

        {milestones.length === 0 && !addingMilestone && (
          <div className="card" style={{ color: 'var(--color-text-muted)' }}>
            No milestones created yet. Click "+ Add Milestone" to set up major completion markers.
          </div>
        )}
      </div>
    </div>
  )
}
