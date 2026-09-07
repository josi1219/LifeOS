import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2, Zap } from 'lucide-react'
import { api } from '../api/client'
import type { Roadmap, RoadmapItem, RoadmapItemTree, Skill } from '../api/types'

function flattenTree(items: RoadmapItemTree[]): RoadmapItem[] {
  const result: RoadmapItem[] = []
  function walk(nodes: RoadmapItemTree[]) {
    for (const node of nodes) {
      result.push(node)
      if (node.children && node.children.length > 0) walk(node.children)
    }
  }
  walk(items)
  return result
}

export function SkillsView({ departmentId }: { departmentId: number }) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [prereqText, setPrereqText] = useState('')
  const [addingSkill, setAddingSkill] = useState(false)

  const [linkedItems, setLinkedItems] = useState<Record<number, number[]>>({})
  const [selectedItemToLink, setSelectedItemToLink] = useState<Record<number, number | ''>>({})

  async function load() {
    const list = await api.get<Skill[]>(`/departments/${departmentId}/skills`)
    setSkills(list)

    const roadmaps = await api.get<Roadmap[]>(`/departments/${departmentId}/roadmaps`)
    const items: RoadmapItem[] = []
    for (const rm of roadmaps) {
      try {
        const tree = await api.get<RoadmapItemTree[]>(`/roadmaps/${rm.id}/items`)
        items.push(...flattenTree(tree))
      } catch {
        // ignore
      }
    }
    setRoadmapItems(items)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await api.post(`/departments/${departmentId}/skills`, {
      name: name.trim(),
      purpose: purpose.trim() || null,
      prerequisite_text: prereqText.trim() || null,
    })
    setName('')
    setPurpose('')
    setPrereqText('')
    setAddingSkill(false)
    await load()
  }

  async function handleUpdate(skillId: number, updates: Partial<Skill>) {
    await api.patch(`/skills/${skillId}`, updates)
    await load()
  }

  async function handleDelete(skillId: number) {
    await api.delete(`/skills/${skillId}`)
    await load()
  }

  async function handleLinkItem(skillId: number) {
    const itemId = selectedItemToLink[skillId]
    if (!itemId) return
    await api.post(`/skills/${skillId}/roadmap-items/${itemId}`)
    setLinkedItems((prev) => ({
      ...prev,
      [skillId]: [...(prev[skillId] ?? []), Number(itemId)],
    }))
    setSelectedItemToLink((prev) => ({ ...prev, [skillId]: '' }))
  }

  async function handleUnlinkItem(skillId: number, itemId: number) {
    await api.delete(`/skills/${skillId}/roadmap-items/${itemId}`)
    setLinkedItems((prev) => ({
      ...prev,
      [skillId]: (prev[skillId] ?? []).filter((id) => id !== itemId),
    }))
  }

  if (loading) return <div className="card">Loading skills inventory...</div>

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Skills & Capabilities</h2>
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
            Track proficiency and anchor skills to roadmap objectives.
          </div>
        </div>
        <button className="primary" onClick={() => setAddingSkill(!addingSkill)} style={{ fontSize: 12 }}>
          <Plus size={14} />
          {addingSkill ? 'Cancel' : 'Add Skill'}
        </button>
      </div>

      {addingSkill && (
        <form onSubmit={handleCreate} className="card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <label style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 13, fontWeight: 600 }}>
            Skill Name
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Distributed Systems & Concurrency" />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 13, fontWeight: 600 }}>
            Purpose / Why
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Why this capability is essential to acquire..."
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 13, fontWeight: 600 }}>
            Prerequisite notes
            <input
              value={prereqText}
              onChange={(e) => setPrereqText(e.target.value)}
              placeholder="e.g. OS primitives, socket programming"
            />
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="primary" type="submit">
              Save Skill
            </button>
            <button type="button" onClick={() => setAddingSkill(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {skills.map((skill) => (
          <div key={skill.id} className="card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={16} color="var(--color-accent-text)" />
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{skill.name}</span>
                </div>
                {skill.purpose && <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>{skill.purpose}</p>}
                {skill.prerequisite_text && (
                  <div style={{ color: 'var(--color-text-faint)', fontSize: 12, marginTop: 4 }}>
                    Prereqs: {skill.prerequisite_text}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className={`status-badge status-${skill.status}`}>{skill.status}</span>
                <select
                  value={skill.status}
                  onChange={(e) => handleUpdate(skill.id, { status: e.target.value })}
                  style={{ fontSize: 11, padding: '3px 6px' }}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => handleDelete(skill.id)} style={{ padding: '4px 8px', fontSize: 11 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Proficiency slider */}
            <div style={{ display: 'grid', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Proficiency</span>
                <strong style={{ color: 'var(--color-accent-text)' }}>{skill.progress}%</strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={skill.progress}
                onChange={(e) => handleUpdate(skill.id, { progress: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent)' }}
              />
            </div>

            {/* Linked Roadmap Items */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', fontSize: 12 }}>
              <span style={{ color: 'var(--color-text-faint)' }}>Anchored Roadmap Objectives: </span>
              {(linkedItems[skill.id] ?? []).map((itemId) => {
                const item = roadmapItems.find((i) => i.id === itemId)
                return (
                  <span
                    key={itemId}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-border)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      marginRight: 6,
                    }}
                  >
                    {item ? item.name : `#${itemId}`}
                    <button
                      type="button"
                      onClick={() => handleUnlinkItem(skill.id, itemId)}
                      style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text-faint)' }}
                    >
                      ×
                    </button>
                  </span>
                )
              })}

              {roadmapItems.length > 0 && (
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
                  <select
                    value={selectedItemToLink[skill.id] ?? ''}
                    onChange={(e) =>
                      setSelectedItemToLink((prev) => ({
                        ...prev,
                        [skill.id]: e.target.value ? Number(e.target.value) : '',
                      }))
                    }
                    style={{ fontSize: 11, padding: '2px 4px' }}
                  >
                    <option value="">+ Link Objective</option>
                    {roadmapItems
                      .filter((ri) => !(linkedItems[skill.id] ?? []).includes(ri.id))
                      .map((ri) => (
                        <option key={ri.id} value={ri.id}>
                          {ri.name}
                        </option>
                      ))}
                  </select>
                  {selectedItemToLink[skill.id] && (
                    <button
                      type="button"
                      onClick={() => handleLinkItem(skill.id)}
                      style={{ fontSize: 11, padding: '2px 6px' }}
                    >
                      Link
                    </button>
                  )}
                </span>
              )}
            </div>
          </div>
        ))}

        {skills.length === 0 && !addingSkill && (
          <div className="card" style={{ color: 'var(--color-text-faint)', textAlign: 'center', padding: 'var(--space-5)' }}>
            No skills tracked yet. Click "Add Skill" to define the capabilities you are mastering.
          </div>
        )}
      </div>
    </div>
  )
}
