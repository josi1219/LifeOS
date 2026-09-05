import { useEffect, useState, type FormEvent } from 'react'
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

  // New skill form state
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [prereqText, setPrereqText] = useState('')
  const [addingSkill, setAddingSkill] = useState(false)

  // Map of skill_id -> list of linked roadmap items
  const [linkedItems, setLinkedItems] = useState<Record<number, number[]>>({})
  const [selectedItemToLink, setSelectedItemToLink] = useState<Record<number, number | ''>>({})

  async function load() {
    const list = await api.get<Skill[]>(`/departments/${departmentId}/skills`)
    setSkills(list)

    // Load department roadmap items to allow linking
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

  if (loading) return <div className="card">Loading skills...</div>

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Skills</h2>
        <button className={addingSkill ? '' : 'primary'} onClick={() => setAddingSkill(!addingSkill)}>
          {addingSkill ? 'Cancel' : '+ Add Skill'}
        </button>
      </div>

      {addingSkill && (
        <form onSubmit={handleCreate} className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            Skill Name
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Distributed Systems" />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            Purpose / Why
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Why this skill is needed..."
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            Prerequisite notes
            <input
              value={prereqText}
              onChange={(e) => setPrereqText(e.target.value)}
              placeholder="e.g. Basic networking, concurrency"
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
          <div key={skill.id} className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{skill.name}</div>
                {skill.purpose && <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{skill.purpose}</div>}
                {skill.prerequisite_text && (
                  <div style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>
                    Prereqs: {skill.prerequisite_text}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className={`status-badge status-${skill.status}`}>{skill.status}</span>
                <select
                  value={skill.status}
                  onChange={(e) => handleUpdate(skill.id, { status: e.target.value })}
                  style={{ fontSize: 12, padding: '2px 4px' }}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => handleDelete(skill.id)} style={{ fontSize: 12, padding: '2px 6px' }}>
                  Delete
                </button>
              </div>
            </div>

            {/* Progress Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 12 }}>
              <span>Progress: {skill.progress}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={skill.progress}
                onChange={(e) => handleUpdate(skill.id, { progress: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
            </div>

            {/* Linked Roadmap Items */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', fontSize: 12 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Linked Roadmap Items: </span>
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
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      marginRight: 6,
                    }}
                  >
                    {item ? item.name : `#${itemId}`}
                    <button
                      type="button"
                      onClick={() => handleUnlinkItem(skill.id, itemId)}
                      style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
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
                    <option value="">+ Link Roadmap Item</option>
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
          <div className="card" style={{ color: 'var(--color-text-muted)' }}>
            No skills tracked for this department yet. Click "+ Add Skill" to start tracking.
          </div>
        )}
      </div>
    </div>
  )
}
