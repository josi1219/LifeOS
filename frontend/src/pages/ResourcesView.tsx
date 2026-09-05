import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Department, Resource } from '../api/types'

const RESOURCE_TYPES = ['url', 'video', 'article', 'book', 'document', 'course', 'note']

export function ResourcesView() {
  const [resources, setResources] = useState<Resource[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const [filterType, setFilterType] = useState<string>('')
  const [filterDep, setFilterDep] = useState<number | ''>('')

  const [title, setTitle] = useState('')
  const [type, setType] = useState('url')
  const [urlOrPath, setUrlOrPath] = useState('')
  const [depId, setDepId] = useState<number | ''>('')

  async function load() {
    let path = '/resources'
    const params = new URLSearchParams()
    if (filterDep !== '') params.set('department_id', String(filterDep))
    if (params.toString()) path += `?${params.toString()}`

    const list = await api.get<Resource[]>(path)
    setResources(list)
    setDepartments(await api.get<Department[]>('/departments'))
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDep])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await api.post('/resources', {
      title: title.trim(),
      type,
      url_or_path: urlOrPath.trim() || null,
      department_id: depId || null,
    })
    setTitle('')
    setUrlOrPath('')
    setDepId('')
    setAdding(false)
    await load()
  }

  async function handleDelete(resourceId: number) {
    await api.delete(`/resources/${resourceId}`)
    await load()
  }

  const displayedResources = filterType
    ? resources.filter((r) => r.type === filterType)
    : resources

  if (loading) return <div className="card">Loading resources...</div>

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 840 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Knowledge & Resources</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Curated books, courses, documentation, and notes attached to your departments and roadmap items.
          </p>
        </div>
        <button className={adding ? '' : 'primary'} onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : '+ Add Resource'}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleCreate} className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            Title
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Designing Data-Intensive Applications" />
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1 }}>
              Type
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1 }}>
              Department
              <select value={depId} onChange={(e) => setDepId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">General</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            URL or Path
            <input value={urlOrPath} onChange={(e) => setUrlOrPath(e.target.value)} placeholder="https://..." />
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="primary" type="submit">
              Save Resource
            </button>
            <button type="button" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ fontSize: 13 }}>
          <option value="">All Types</option>
          {RESOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
            </option>
          ))}
        </select>
        <select
          value={filterDep}
          onChange={(e) => setFilterDep(e.target.value ? Number(e.target.value) : '')}
          style={{ fontSize: 13 }}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {displayedResources.map((r) => {
          const dep = departments.find((d) => d.id === r.department_id)
          return (
            <div
              key={r.id}
              className="card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-border)',
                      fontWeight: 600,
                    }}
                  >
                    {r.type.toUpperCase()}
                  </span>
                  <strong style={{ fontSize: 15 }}>{r.title}</strong>
                  {dep && <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>({dep.name})</span>}
                </div>
                {r.url_or_path && (
                  <div style={{ marginTop: 4 }}>
                    <a href={r.url_or_path} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                      {r.url_or_path} ↗
                    </a>
                  </div>
                )}
              </div>
              <button onClick={() => handleDelete(r.id)} style={{ fontSize: 12 }}>
                Delete
              </button>
            </div>
          )
        })}

        {displayedResources.length === 0 && !adding && (
          <div className="card" style={{ color: 'var(--color-text-muted)' }}>
            No resources found. Click "+ Add Resource" to catalog learning material.
          </div>
        )}
      </div>
    </div>
  )
}
