import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import type { Department } from '../../api/types'

interface Row {
  name: string
  purpose: string
  goalName: string
  goalWhy: string
  roadmapName: string
  skillName: string
}

const EMPTY_ROW: Row = {
  name: '',
  purpose: '',
  goalName: '',
  goalWhy: '',
  roadmapName: '',
  skillName: '',
}

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }])
  const [submitting, setSubmitting] = useState(false)

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }])
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      for (const row of rows) {
        if (!row.name.trim()) continue
        const department = await api.post<Department>('/departments', {
          name: row.name,
          purpose: row.purpose || undefined,
        })
        if (row.goalName.trim()) {
          await api.post(`/departments/${department.id}/goals`, {
            name: row.goalName,
            why: row.goalWhy || undefined,
          })
        }
        if (row.roadmapName.trim()) {
          await api.post(`/departments/${department.id}/roadmaps`, {
            name: row.roadmapName.trim(),
          })
        }
        if (row.skillName.trim()) {
          await api.post(`/departments/${department.id}/skills`, {
            name: row.skillName.trim(),
          })
        }
      }
      onComplete()
      navigate('/')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-5)' }}>
      <div style={{ width: 640, display: 'grid', gap: 'var(--space-4)' }}>
        <div>
          <h1>Welcome to LifeOS</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            What are your major departments (Coding, Forex, University...)? List them in priority order — the
            first one becomes your default current focus. You can also optionally seed an initial roadmap and skill.
          </p>
        </div>

        {rows.map((row, index) => (
          <div key={index} className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Department #{index + 1}</strong>
              {rows.length > 1 && (
                <button type="button" onClick={() => removeRow(index)}>
                  Remove
                </button>
              )}
            </div>
            <input
              placeholder="Department name (e.g. Coding)"
              value={row.name}
              onChange={(e) => updateRow(index, 'name', e.target.value)}
            />
            <input
              placeholder="Department purpose (optional)"
              value={row.purpose}
              onChange={(e) => updateRow(index, 'purpose', e.target.value)}
            />
            <input
              placeholder="Primary goal name (optional)"
              value={row.goalName}
              onChange={(e) => updateRow(index, 'goalName', e.target.value)}
            />
            <input
              placeholder="Why this goal matters (optional)"
              value={row.goalWhy}
              onChange={(e) => updateRow(index, 'goalWhy', e.target.value)}
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                placeholder="Initial roadmap name (optional, e.g. Full Stack)"
                value={row.roadmapName}
                onChange={(e) => updateRow(index, 'roadmapName', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                placeholder="Initial skill to master (optional, e.g. FastAPI)"
                value={row.skillName}
                onChange={(e) => updateRow(index, 'skillName', e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" onClick={addRow}>
            Add another department
          </button>
          <button className="primary" type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Setting up...' : 'Finish setup'}
          </button>
        </div>
      </div>
    </div>
  )
}
