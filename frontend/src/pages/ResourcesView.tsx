import { useEffect, useState, type FormEvent } from 'react'
import {
  BookOpen,
  FileText,
  Filter,
  GraduationCap,
  Link as LinkIcon,
  Plus,
  StickyNote,
  Trash2,
  Video,
} from 'lucide-react'
import { api } from '../api/client'
import type { Department, Resource } from '../api/types'

const RESOURCE_TYPES = [
  { id: 'url', label: 'URL / Link', icon: LinkIcon },
  { id: 'book', label: 'Book', icon: BookOpen },
  { id: 'course', label: 'Course', icon: GraduationCap },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'article', label: 'Article', icon: FileText },
  { id: 'note', label: 'Note / Document', icon: StickyNote },
]

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

  if (loading) return <div className="card">Loading knowledge base...</div>

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
                background: 'var(--color-emerald-subtle)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-emerald)',
              }}
            >
              <BookOpen size={18} />
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Knowledge & Resources</h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0', fontSize: 13 }}>
            Curated books, documentation, and videos anchored to your active departments.
          </p>
        </div>
        <button className="primary" onClick={() => setAdding(!adding)} style={{ fontSize: 13 }}>
          <Plus size={14} />
          {adding ? 'Cancel' : 'New Resource'}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleCreate} className="card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <label style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 13, fontWeight: 600 }}>
            Title
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Designing Data-Intensive Applications" />
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1, fontSize: 12 }}>
              Resource Type
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1, fontSize: 12 }}>
              Department (Optional)
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
          <label style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 12 }}>
            URL or Local Path
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
        <Filter size={14} color="var(--color-text-faint)" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ fontSize: 12 }}>
          <option value="">All Media Types</option>
          {RESOURCE_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={filterDep}
          onChange={(e) => setFilterDep(e.target.value ? Number(e.target.value) : '')}
          style={{ fontSize: 12 }}
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
          const typeConfig = RESOURCE_TYPES.find((t) => t.id === r.type) ?? RESOURCE_TYPES[0]
          const TypeIcon = typeConfig.icon

          return (
            <div
              key={r.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'var(--color-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-accent-text)',
                  }}
                >
                  <TypeIcon size={16} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 15, color: '#ffffff' }}>{r.title}</strong>
                    {dep && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-faint)', background: 'var(--color-surface-raised)', padding: '2px 6px', borderRadius: 4 }}>
                        {dep.name}
                      </span>
                    )}
                  </div>
                  {r.url_or_path && (
                    <a
                      href={r.url_or_path}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12, marginTop: 2, display: 'inline-block' }}
                    >
                      {r.url_or_path} ↗
                    </a>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 8px', fontSize: 11 }}>
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}

        {displayedResources.length === 0 && !adding && (
          <div className="card" style={{ color: 'var(--color-text-faint)', textAlign: 'center', padding: 'var(--space-5)' }}>
            No resources cataloged yet. Click "New Resource" to curate your knowledge library.
          </div>
        )}
      </div>
    </div>
  )
}
