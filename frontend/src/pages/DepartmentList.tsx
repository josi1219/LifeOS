import { useEffect, useState, type DragEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Department } from '../api/types'

export function DepartmentList() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  async function load() {
    setDepartments(await api.get<Department[]>('/departments'))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    await api.post('/departments', { name, purpose: purpose || undefined })
    setName('')
    setPurpose('')
    await load()
  }

  function handleDragStart(index: number) {
    setDragIndex(index)
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
  }

  async function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    const reordered = [...departments]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    setDragIndex(null)
    setDepartments(reordered)
    await api.patch('/departments/reorder', { ordered_ids: reordered.map((d) => d.id) })
    await load()
  }

  if (loading) return <div className="card">Loading...</div>

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 640 }}>
      <div>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>Departments</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0 }}>
          Drag to reorder — priority determines what the dashboard treats as your current focus by default.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {departments.map((department, index) => (
          <div
            key={department.id}
            className="card"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab' }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                #{department.priority} — <Link to={`/departments/${department.id}`}>{department.name}</Link>
              </div>
              {department.purpose && (
                <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{department.purpose}</div>
              )}
            </div>
            <span className={`status-badge status-${department.status}`}>{department.status}</span>
          </div>
        ))}
        {departments.length === 0 && (
          <div className="card" style={{ color: 'var(--color-text-muted)' }}>
            No departments yet — add your first one below.
          </div>
        )}
      </div>

      <form onSubmit={handleCreate} className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Add a department</h2>
        <input placeholder="Name (e.g. Coding)" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Purpose (optional)" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        <button className="primary" type="submit" style={{ justifySelf: 'start' }}>
          Add department
        </button>
      </form>
    </div>
  )
}
