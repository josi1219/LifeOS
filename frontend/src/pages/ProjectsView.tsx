import { useEffect, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Github,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'
import { api } from '../api/client'
import type { Project, Task } from '../api/types'
import { useTimer } from '../features/timer/TimerContext'

function ProjectTasks({ projectId }: { projectId: number }) {
  const { startTimer, activeSession } = useTimer()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskName, setNewTaskName] = useState('')

  async function loadTasks() {
    const list = await api.get<Task[]>(`/projects/${projectId}/tasks`)
    setTasks(list)
  }

  useEffect(() => {
    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleAddTask(e: FormEvent) {
    e.preventDefault()
    if (!newTaskName.trim()) return
    await api.post(`/projects/${projectId}/tasks`, { name: newTaskName.trim() })
    setNewTaskName('')
    await loadTasks()
  }

  async function handleToggleStatus(task: Task) {
    const nextStatus = task.status === 'completed' ? 'not_started' : 'completed'
    await api.patch(`/tasks/${task.id}`, { status: nextStatus })
    await loadTasks()
  }

  async function handleDeleteTask(taskId: number) {
    await api.delete(`/tasks/${taskId}`)
    await loadTasks()
  }

  return (
    <div style={{ marginTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          Action Checklist ({tasks.filter((t) => t.status === 'completed').length}/{tasks.length})
        </span>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {tasks.map((t) => {
          const isDone = t.status === 'completed'
          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDone ? 'rgba(255, 255, 255, 0.02)' : 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.15s ease',
              }}
            >
              <button
                type="button"
                onClick={() => handleToggleStatus(t)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: isDone ? 'var(--color-text-faint)' : 'var(--color-text)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  textAlign: 'left',
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={16} color="var(--color-emerald)" />
                ) : (
                  <Circle size={16} color="var(--color-text-faint)" />
                )}
                <span>{t.name}</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => startTimer({ project_id: projectId, task_id: t.id })}
                  title="Track time on this task"
                  style={{
                    border: 'none',
                    background: activeSession?.task_id === t.id ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: activeSession?.task_id === t.id ? '#10b981' : 'var(--color-text-faint)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 11,
                  }}
                >
                  <Play size={10} fill="currentColor" />
                  <span>{activeSession?.task_id === t.id ? 'Focusing' : 'Track'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTask(t.id)}
                  style={{ border: 'none', background: 'none', padding: '0 4px', cursor: 'pointer', color: 'var(--color-text-faint)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}

        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <input
            placeholder="Add actionable sub-task..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            style={{ fontSize: 12, padding: '5px 10px', flex: 1 }}
          />
          <button className="primary" type="submit" style={{ fontSize: 12, padding: '5px 12px' }}>
            <Plus size={13} /> Add
          </button>
        </form>
      </div>
    </div>
  )
}

export function ProjectsView({ departmentId }: { departmentId: number }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [addingProject, setAddingProject] = useState(false)

  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [deployUrl, setDeployUrl] = useState('')
  const [notes, setNotes] = useState('')

  async function load() {
    const list = await api.get<Project[]>(`/departments/${departmentId}/projects`)
    setProjects(list)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await api.post(`/departments/${departmentId}/projects`, {
      name: name.trim(),
      purpose: purpose.trim() || null,
      repo_url: repoUrl.trim() || null,
      deployment_url: deployUrl.trim() || null,
      notes: notes.trim() || null,
    })
    setName('')
    setPurpose('')
    setRepoUrl('')
    setDeployUrl('')
    setNotes('')
    setAddingProject(false)
    await load()
  }

  async function handleUpdate(projectId: number, updates: Partial<Project>) {
    await api.patch(`/projects/${projectId}`, updates)
    await load()
  }

  async function handleDelete(projectId: number) {
    await api.delete(`/projects/${projectId}`)
    await load()
  }

  if (loading) return <div className="card">Loading projects...</div>

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Projects & Deliverables</h2>
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
            Concrete applications, repos, and artifacts under this department.
          </div>
        </div>
        <button className="primary" onClick={() => setAddingProject(!addingProject)} style={{ fontSize: 12 }}>
          <Plus size={14} />
          {addingProject ? 'Cancel' : 'New Project'}
        </button>
      </div>

      {addingProject && (
        <form onSubmit={handleCreate} className="card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <label style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 13, fontWeight: 600 }}>
            Project Name
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. LifeOS Core" />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 13, fontWeight: 600 }}>
            Purpose / Objective
            <textarea rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What does this project ship?" />
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1, fontSize: 12 }}>
              Repository URL
              <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/..." />
            </label>
            <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1, fontSize: 12 }}>
              Live Deployment URL
              <input value={deployUrl} onChange={(e) => setDeployUrl(e.target.value)} placeholder="https://..." />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="primary" type="submit">
              Save Project
            </button>
            <button type="button" onClick={() => setAddingProject(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {projects.map((p) => (
          <div key={p.id} className="card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{p.name}</div>
                {p.purpose && <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>{p.purpose}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12 }}>
                  {p.repo_url && (
                    <a href={p.repo_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Github size={13} /> Repo ↗
                    </a>
                  )}
                  {p.deployment_url && (
                    <a href={p.deployment_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ExternalLink size={13} /> Live App ↗
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className={`status-badge status-${p.status}`}>{p.status}</span>
                <select
                  value={p.status}
                  onChange={(e) =>
                    handleUpdate(p.id, {
                      status: e.target.value,
                      progress: e.target.value === 'completed' ? 100 : p.progress,
                    })
                  }
                  style={{ fontSize: 11, padding: '3px 6px' }}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
                <button onClick={() => handleDelete(p.id)} style={{ padding: '4px 8px', fontSize: 11 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: 'grid', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Progress: {p.progress}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={p.progress}
                onChange={(e) => handleUpdate(p.id, { progress: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent)' }}
              />
            </div>

            {/* Tasks inline */}
            <ProjectTasks projectId={p.id} />
          </div>
        ))}

        {projects.length === 0 && !addingProject && (
          <div className="card" style={{ color: 'var(--color-text-faint)', textAlign: 'center', padding: 'var(--space-5)' }}>
            No projects in this department yet. Click "New Project" to track your builds.
          </div>
        )}
      </div>
    </div>
  )
}
