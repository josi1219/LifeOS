import { useEffect, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  GitBranch,
  Link as LinkIcon,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react'
import { api } from '../api/client'
import type { Roadmap, RoadmapItemTree } from '../api/types'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ size?: number; color?: string }> }> = {
  not_started: { label: 'Not Started', icon: Clock },
  in_progress: { label: 'In Progress', icon: GitBranch },
  completed: { label: 'Completed', icon: CheckCircle2 },
  blocked: { label: 'Blocked', icon: XCircle },
}

interface RoadmapItemNodeProps {
  item: RoadmapItemTree
  level: number
  allItemIds: { id: number; name: string }[]
  onUpdate: (itemId: number, updates: Partial<RoadmapItemTree>) => Promise<void>
  onDelete: (itemId: number) => Promise<void>
  onAddChild: (parentId: number, name: string) => Promise<void>
  onAddPrereq: (itemId: number, prereqId: number) => Promise<void>
  onRemovePrereq: (itemId: number, prereqId: number) => Promise<void>
}

function RoadmapItemNode({
  item,
  level,
  allItemIds,
  onUpdate,
  onDelete,
  onAddChild,
  onAddPrereq,
  onRemovePrereq,
}: RoadmapItemNodeProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [addingChild, setAddingChild] = useState(false)
  const [childName, setChildName] = useState('')
  const [selectedPrereq, setSelectedPrereq] = useState<number | ''>('')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editDesc, setEditDesc] = useState(item.description ?? '')
  const [editHours, setEditHours] = useState<number | ''>(item.estimated_hours ?? '')

  const statusObj = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.not_started
  const StatusIcon = statusObj.icon
  const hasChildren = item.children && item.children.length > 0

  async function handleAddChildSubmit(e: FormEvent) {
    e.preventDefault()
    if (!childName.trim()) return
    await onAddChild(item.id, childName.trim())
    setChildName('')
    setAddingChild(false)
  }

  async function handleSaveEdit() {
    await onUpdate(item.id, {
      name: editName,
      description: editDesc || null,
      estimated_hours: editHours === '' ? null : Number(editHours),
    })
    setEditing(false)
  }

  const availablePrereqs = allItemIds.filter(
    (other) => other.id !== item.id && !item.prerequisite_ids.includes(other.id),
  )

  return (
    <div style={{ marginLeft: level * 24, marginTop: 'var(--space-2)' }}>
      <div
        className="card"
        style={{
          display: 'grid',
          gap: 'var(--space-2)',
          background: 'var(--color-surface)',
          borderLeft: `4px solid ${
            item.status === 'completed'
              ? 'var(--color-emerald)'
              : item.status === 'in_progress'
                ? 'var(--color-amber)'
                : item.status === 'blocked'
                  ? 'var(--color-rose)'
                  : 'var(--color-text-faint)'
          }`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {hasChildren && (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                style={{ padding: '2px 4px', background: 'transparent', border: 'none', color: 'var(--color-text-muted)' }}
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
            <span style={{ fontWeight: 700, fontSize: 15, color: '#ffffff' }}>{item.name}</span>
            {item.estimated_hours && (
              <span style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>
                ({item.estimated_hours}h)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* Status with Color AND explicit icon + label */}
            <span className={`status-badge status-${item.status}`}>
              <StatusIcon size={12} />
              <span>{statusObj.label}</span>
            </span>

            <select
              value={item.status}
              onChange={(e) =>
                onUpdate(item.id, {
                  status: e.target.value,
                  progress: e.target.value === 'completed' ? 100 : item.progress,
                })
              }
              style={{ fontSize: 11, padding: '3px 6px' }}
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>

            <button type="button" onClick={() => setEditing(!editing)} style={{ padding: '4px 8px', fontSize: 11 }}>
              <Edit3 size={12} />
            </button>
            <button type="button" onClick={() => onDelete(item.id)} style={{ padding: '4px 8px', fontSize: 11 }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {item.description && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{item.description}</div>
        )}

        {/* Edit form */}
        {editing && (
          <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-2)', background: 'var(--color-surface-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Item name" />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description / Requirements"
              rows={2}
            />
            <input
              type="number"
              value={editHours}
              onChange={(e) => setEditHours(e.target.value ? Number(e.target.value) : '')}
              placeholder="Estimated hours"
            />
            <button className="primary" type="button" onClick={handleSaveEdit} style={{ justifySelf: 'start', fontSize: 12 }}>
              Save Details
            </button>
          </div>
        )}

        {/* Prerequisites */}
        <div style={{ fontSize: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-1)', borderTop: '1px solid var(--color-border)', paddingTop: 6 }}>
          <span style={{ color: 'var(--color-text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <LinkIcon size={12} /> Prerequisites:
          </span>
          {item.prerequisite_ids.length === 0 && (
            <span style={{ color: 'var(--color-text-faint)' }}>None</span>
          )}
          {item.prerequisite_ids.map((pId) => {
            const found = allItemIds.find((x) => x.id === pId)
            return (
              <span
                key={pId}
                style={{
                  background: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                }}
              >
                {found ? found.name : `#${pId}`}
                <button
                  type="button"
                  onClick={() => onRemovePrereq(item.id, pId)}
                  style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text-faint)' }}
                >
                  ×
                </button>
              </span>
            )
          })}

          {availablePrereqs.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
              <select
                value={selectedPrereq}
                onChange={(e) => setSelectedPrereq(e.target.value ? Number(e.target.value) : '')}
                style={{ fontSize: 11, padding: '2px 4px' }}
              >
                <option value="">+ Link Prereq</option>
                {availablePrereqs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {selectedPrereq !== '' && (
                <button
                  type="button"
                  onClick={async () => {
                    await onAddPrereq(item.id, Number(selectedPrereq))
                    setSelectedPrereq('')
                  }}
                  style={{ fontSize: 11, padding: '2px 6px' }}
                >
                  Add
                </button>
              )}
            </span>
          )}
        </div>

        {/* Add Child button */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {!addingChild ? (
            <button
              type="button"
              onClick={() => setAddingChild(true)}
              style={{ fontSize: 11, padding: '3px 8px', background: 'transparent', color: 'var(--color-accent-text)' }}
            >
              <Plus size={12} /> Add Sub-action
            </button>
          ) : (
            <form onSubmit={handleAddChildSubmit} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                placeholder="Sub-action name..."
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                style={{ fontSize: 12, padding: '4px 8px' }}
                autoFocus
              />
              <button className="primary" type="submit" style={{ fontSize: 11, padding: '4px 8px' }}>
                Save
              </button>
              <button
                type="button"
                onClick={() => setAddingChild(false)}
                style={{ fontSize: 11, padding: '4px 8px' }}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Children items */}
      {!collapsed && hasChildren && (
        <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
          {item.children.map((child) => (
            <RoadmapItemNode
              key={child.id}
              item={child}
              level={level + 1}
              allItemIds={allItemIds}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onAddPrereq={onAddPrereq}
              onRemovePrereq={onRemovePrereq}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function RoadmapView({ departmentId }: { departmentId: number }) {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<number | null>(null)
  const [tree, setTree] = useState<RoadmapItemTree[]>([])
  const [loading, setLoading] = useState(true)
  const [newRoadmapName, setNewRoadmapName] = useState('')
  const [newRootItemName, setNewRootItemName] = useState('')

  async function loadRoadmaps() {
    const list = await api.get<Roadmap[]>(`/departments/${departmentId}/roadmaps`)
    setRoadmaps(list)
    if (list.length > 0) {
      const activeId = selectedRoadmapId ?? list[0].id
      setSelectedRoadmapId(activeId)
      await loadTree(activeId)
    } else {
      setSelectedRoadmapId(null)
      setTree([])
    }
    setLoading(false)
  }

  async function loadTree(roadmapId: number) {
    try {
      const items = await api.get<RoadmapItemTree[]>(`/roadmaps/${roadmapId}/items`)
      setTree(items)
    } catch {
      setTree([])
    }
  }

  useEffect(() => {
    loadRoadmaps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId])

  async function handleSelectRoadmap(id: number) {
    setSelectedRoadmapId(id)
    await loadTree(id)
  }

  async function handleCreateRoadmap(e: FormEvent) {
    e.preventDefault()
    if (!newRoadmapName.trim()) return
    const rm = await api.post<Roadmap>(`/departments/${departmentId}/roadmaps`, { name: newRoadmapName.trim() })
    setNewRoadmapName('')
    await loadRoadmaps()
    setSelectedRoadmapId(rm.id)
    await loadTree(rm.id)
  }

  async function handleCreateRootItem(e: FormEvent) {
    e.preventDefault()
    if (!selectedRoadmapId || !newRootItemName.trim()) return
    await api.post(`/roadmaps/${selectedRoadmapId}/items`, { name: newRootItemName.trim() })
    setNewRootItemName('')
    await loadTree(selectedRoadmapId)
  }

  async function handleUpdateItem(itemId: number, updates: Partial<RoadmapItemTree>) {
    await api.patch(`/roadmap-items/${itemId}`, updates)
    if (selectedRoadmapId) await loadTree(selectedRoadmapId)
  }

  async function handleDeleteItem(itemId: number) {
    await api.delete(`/roadmap-items/${itemId}`)
    if (selectedRoadmapId) await loadTree(selectedRoadmapId)
  }

  async function handleAddChild(parentId: number, name: string) {
    if (!selectedRoadmapId) return
    await api.post(`/roadmaps/${selectedRoadmapId}/items`, { name, parent_id: parentId })
    await loadTree(selectedRoadmapId)
  }

  async function handleAddPrereq(itemId: number, prereqId: number) {
    await api.post(`/roadmap-items/${itemId}/prerequisites`, { prerequisite_item_id: prereqId })
    if (selectedRoadmapId) await loadTree(selectedRoadmapId)
  }

  async function handleRemovePrereq(itemId: number, prereqId: number) {
    await api.delete(`/roadmap-items/${itemId}/prerequisites/${prereqId}`)
    if (selectedRoadmapId) await loadTree(selectedRoadmapId)
  }

  const allItems: { id: number; name: string }[] = []
  function collect(nodes: RoadmapItemTree[]) {
    for (const node of nodes) {
      allItems.push({ id: node.id, name: node.name })
      if (node.children) collect(node.children)
    }
  }
  collect(tree)

  if (loading) return <div className="card">Loading roadmap architecture...</div>

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      {/* Roadmap switcher & create */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>
            Roadmaps:
          </span>
          {roadmaps.map((rm) => (
            <button
              key={rm.id}
              type="button"
              className={selectedRoadmapId === rm.id ? 'primary' : ''}
              onClick={() => handleSelectRoadmap(rm.id)}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              {rm.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleCreateRoadmap} style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            placeholder="New Roadmap name"
            value={newRoadmapName}
            onChange={(e) => setNewRoadmapName(e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px' }}
          />
          <button className="primary" type="submit" style={{ fontSize: 12, padding: '4px 10px' }}>
            <Plus size={13} />
            Add Roadmap
          </button>
        </form>
      </div>

      {selectedRoadmapId ? (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {/* Add top-level objective */}
          <form onSubmit={handleCreateRootItem} className="card" style={{ display: 'flex', gap: 'var(--space-2)', background: 'var(--color-surface)' }}>
            <input
              placeholder="Add root learning objective or major roadmap node..."
              value={newRootItemName}
              onChange={(e) => setNewRootItemName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="primary" type="submit">
              <Plus size={14} /> Add Node
            </button>
          </form>

          {/* Tree view */}
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {tree.map((item) => (
              <RoadmapItemNode
                key={item.id}
                item={item}
                level={0}
                allItemIds={allItems}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
                onAddChild={handleAddChild}
                onAddPrereq={handleAddPrereq}
                onRemovePrereq={handleRemovePrereq}
              />
            ))}
            {tree.length === 0 && (
              <div className="card" style={{ color: 'var(--color-text-faint)', textAlign: 'center', padding: 'var(--space-5)' }}>
                No objectives mapped out yet. Add your first root node above.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ color: 'var(--color-text-faint)', textAlign: 'center', padding: 'var(--space-5)' }}>
          No roadmaps configured yet for this department. Create one above to structure your trajectory.
        </div>
      )}
    </div>
  )
}
