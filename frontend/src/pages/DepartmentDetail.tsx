import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Compass,
  Edit3,
  Flag,
  FolderKanban,
  History,
  Map,
  Plus,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { api } from '../api/client'
import type { ChangeRecord, Department, Goal } from '../api/types'
import { GoalForm, type GoalFormValues } from './GoalForm'
import { MilestonesView } from './MilestonesView'
import { ProjectsView } from './ProjectsView'
import { RoadmapView } from './RoadmapView'
import { SkillsView } from './SkillsView'

type TabType = 'overview' | 'roadmaps' | 'skills' | 'milestones' | 'projects'

const TABS = [
  { id: 'overview' as const, label: 'Goals & Philosophy', icon: Target },
  { id: 'roadmaps' as const, label: 'Roadmaps', icon: Map },
  { id: 'skills' as const, label: 'Skills', icon: Zap },
  { id: 'milestones' as const, label: 'Milestones', icon: Flag },
  { id: 'projects' as const, label: 'Projects & Tasks', icon: FolderKanban },
]

export function DepartmentDetail() {
  const { id } = useParams<{ id: string }>()
  const departmentId = Number(id)

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [department, setDepartment] = useState<Department | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [changes, setChanges] = useState<ChangeRecord[]>([])
  const [editingDepartment, setEditingDepartment] = useState(false)
  const [addingGoal, setAddingGoal] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null)
  const [phase, setPhase] = useState('')
  const [status, setStatus] = useState('active')

  async function load() {
    const dep = await api.get<Department>(`/departments/${id}`)
    setDepartment(dep)
    setPhase(dep.current_phase ?? '')
    setStatus(dep.status)
    setGoals(await api.get<Goal[]>(`/departments/${id}/goals`))
    setChanges(await api.get<ChangeRecord[]>(`/departments/${id}/changes`))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function saveDepartment() {
    await api.patch(`/departments/${id}`, { current_phase: phase || null, status })
    setEditingDepartment(false)
    await load()
  }

  async function createGoal(values: GoalFormValues) {
    await api.post(`/departments/${id}/goals`, {
      ...values,
      target_date: values.target_date || null,
    })
    setAddingGoal(false)
    await load()
  }

  async function updateGoal(goalId: number, values: GoalFormValues) {
    await api.patch(`/goals/${goalId}`, { ...values, target_date: values.target_date || null })
    setEditingGoalId(null)
    await load()
  }

  async function deleteGoal(goalId: number) {
    await api.delete(`/goals/${goalId}`)
    await load()
  }

  if (!department) return <div className="card">Loading workspace...</div>

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 960, margin: '0 auto' }}>
      {/* Department Banner & Overview Card */}
      <div
        className="card card-glow"
        style={{
          padding: 'var(--space-5)',
          display: 'grid',
          gap: 'var(--space-3)',
          borderTop: '3px solid var(--color-accent)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent-text)',
              }}
            >
              <Compass size={20} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
                #{department.priority} {department.name}
              </h1>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Current Phase: <strong style={{ color: 'var(--color-accent-text)' }}>{department.current_phase ?? 'Active Execution'}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className={`status-badge status-${department.status}`}>{department.status}</span>
            <button
              onClick={() => setEditingDepartment(!editingDepartment)}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              <Edit3 size={13} />
              {editingDepartment ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>

        {department.purpose && (
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 14 }}>
            {department.purpose}
          </p>
        )}

        {editingDepartment && (
          <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-2)', background: 'var(--color-surface-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
            <label style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 12 }}>
              Current Phase
              <input value={phase} onChange={(e) => setPhase(e.target.value)} placeholder="e.g. Scaling & Optimization" />
            </label>
            <label style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 12 }}>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
              <button className="primary" onClick={saveDepartment} style={{ fontSize: 12 }}>
                Save Changes
              </button>
              <button onClick={() => setEditingDepartment(false)} style={{ fontSize: 12 }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Pill-Style Tab Switcher */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          background: 'var(--color-surface)',
          padding: 4,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          width: 'fit-content',
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? 'var(--color-accent)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                borderColor: 'transparent',
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                boxShadow: isActive ? '0 0 12px var(--color-accent-glow)' : 'none',
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {/* Goals List with prominent "Why This Matters" Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Strategic Goals</h2>
                <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
                  Clear intent and definitions of success.
                </div>
              </div>
              <button className="primary" onClick={() => setAddingGoal((v) => !v)} style={{ fontSize: 12 }}>
                <Plus size={14} />
                {addingGoal ? 'Cancel' : 'Add Goal'}
              </button>
            </div>

            {addingGoal && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <GoalForm submitLabel="Create Goal" onSubmit={createGoal} onCancel={() => setAddingGoal(false)} />
              </div>
            )}

            <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              {goals.map((goal) =>
                editingGoalId === goal.id ? (
                  <div key={goal.id} className="card">
                    <GoalForm
                      initial={goal}
                      submitLabel="Save Goal"
                      onSubmit={(values) => updateGoal(goal.id, values)}
                      onCancel={() => setEditingGoalId(null)}
                    />
                  </div>
                ) : (
                  <div
                    key={goal.id}
                    className="card"
                    style={{
                      display: 'grid',
                      gap: 'var(--space-3)',
                      background: 'var(--color-surface-raised)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>{goal.name}</div>
                        {goal.description && (
                          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0', fontSize: 13 }}>
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <span className={`status-badge status-${goal.status}`}>{goal.status}</span>
                    </div>

                    {/* Spotlight: WHY THIS MATTERS (The core LifeOS hook from mockup) */}
                    {(goal.why || goal.success_definition) && (
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)',
                          border: '1px solid rgba(124, 92, 252, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-3)',
                          display: 'grid',
                          gap: 6,
                        }}
                      >
                        {goal.why && (
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-accent-text)', textTransform: 'uppercase' }}>
                              Why This Matters
                            </span>
                            <div style={{ fontSize: 13, color: '#ffffff', marginTop: 2 }}>{goal.why}</div>
                          </div>
                        )}
                        {goal.success_definition && (
                          <div style={{ borderTop: goal.why ? '1px solid rgba(255, 255, 255, 0.05)' : 'none', paddingTop: goal.why ? 6 : 0 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-cyan)', textTransform: 'uppercase' }}>
                              Definition of Done
                            </span>
                            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                              {goal.success_definition}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      {goal.target_date ? (
                        <span style={{ color: 'var(--color-text-faint)' }}>
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span />
                      )}
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button onClick={() => setEditingGoalId(goal.id)} style={{ fontSize: 11, padding: '3px 8px' }}>
                          Edit
                        </button>
                        <button onClick={() => deleteGoal(goal.id)} style={{ fontSize: 11, padding: '3px 8px' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ),
              )}

              {goals.length === 0 && !addingGoal && (
                <div style={{ color: 'var(--color-text-faint)', fontSize: 13 }}>
                  No goals set for this department yet. Click "+ Add Goal" to anchor your focus.
                </div>
              )}
            </div>
          </div>

          {/* Change History Log */}
          <div className="card">
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-3)' }}>
              <History size={16} color="var(--color-text-faint)" />
              Department Evolution & Decisions
            </h3>
            <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
              {changes.map((change) => (
                <div
                  key={change.id}
                  style={{
                    fontSize: 12,
                    padding: '6px 10px',
                    background: 'var(--color-surface-raised)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong>{change.field_name}</strong>: {change.previous_value ?? '(initial)'} →{' '}
                    <span style={{ color: 'var(--color-accent-text)' }}>{change.new_value ?? '(empty)'}</span>
                  </div>
                  <span style={{ color: 'var(--color-text-faint)' }}>
                    {new Date(change.changed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {changes.length === 0 && (
                <div style={{ color: 'var(--color-text-faint)', fontSize: 13 }}>
                  No changes recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roadmaps' && <RoadmapView departmentId={departmentId} />}
      {activeTab === 'skills' && <SkillsView departmentId={departmentId} />}
      {activeTab === 'milestones' && <MilestonesView departmentId={departmentId} />}
      {activeTab === 'projects' && <ProjectsView departmentId={departmentId} />}
    </div>
  )
}
