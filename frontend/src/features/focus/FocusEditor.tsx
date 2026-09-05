import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Department, FocusState, Goal, Milestone, Roadmap, RoadmapItem, RoadmapItemTree } from '../../api/types'

interface FocusEditorProps {
  current: FocusState
  onSaved: () => void
  onCancel: () => void
}

function flattenTree(items: RoadmapItemTree[]): RoadmapItem[] {
  const result: RoadmapItem[] = []
  function walk(nodes: RoadmapItemTree[]) {
    for (const node of nodes) {
      result.push(node)
      if (node.children && node.children.length > 0) {
        walk(node.children)
      }
    }
  }
  walk(items)
  return result
}

export function FocusEditor({ current, onSaved, onCancel }: FocusEditorProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([])

  const [departmentId, setDepartmentId] = useState<number | ''>(current.department?.id ?? '')
  const [goalId, setGoalId] = useState<number | ''>(current.goal?.id ?? '')
  const [milestoneId, setMilestoneId] = useState<number | ''>(current.milestone?.id ?? '')
  const [nextActionId, setNextActionId] = useState<number | ''>(current.next_action_roadmap_item?.id ?? '')
  const [note, setNote] = useState(current.note ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get<Department[]>('/departments').then(setDepartments)
  }, [])

  useEffect(() => {
    if (!departmentId) {
      setGoals([])
      setMilestones([])
      setRoadmapItems([])
      return
    }
    api.get<Goal[]>(`/departments/${departmentId}/goals`).then(setGoals)
    api.get<Milestone[]>(`/departments/${departmentId}/milestones`).then(setMilestones)
    api.get<Roadmap[]>(`/departments/${departmentId}/roadmaps`).then(async (roadmaps) => {
      const allItems: RoadmapItem[] = []
      for (const rm of roadmaps) {
        try {
          const tree = await api.get<RoadmapItemTree[]>(`/roadmaps/${rm.id}/items`)
          allItems.push(...flattenTree(tree))
        } catch {
          // ignore
        }
      }
      setRoadmapItems(allItems)
    })
  }, [departmentId])

  async function handleSave() {
    setSubmitting(true)
    try {
      await api.patch('/focus', {
        department_id: departmentId || null,
        goal_id: goalId || null,
        milestone_id: milestoneId || null,
        next_action_roadmap_item_id: nextActionId || null,
        note: note || null,
      })
      onSaved()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
      <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
        Department
        <select
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value ? Number(e.target.value) : '')
            setGoalId('')
            setMilestoneId('')
            setNextActionId('')
          }}
        >
          <option value="">None</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
        Goal
        <select value={goalId} onChange={(e) => setGoalId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">None</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
        Milestone
        <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">None</option>
          {milestones.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.status})
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
        Next Action (Roadmap Item)
        <select value={nextActionId} onChange={(e) => setNextActionId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">None</option>
          {roadmapItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} [{item.status}]
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
        Note / Context
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where was I? What's the immediate next step?" />
      </label>

      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className="primary" onClick={handleSave} disabled={submitting}>
          Save focus
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
