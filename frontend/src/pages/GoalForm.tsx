import { useState, type FormEvent } from 'react'
import type { Goal } from '../api/types'

export interface GoalFormValues {
  name: string
  description: string
  why: string
  success_definition: string
  target_date: string
  status: string
}

interface GoalFormProps {
  initial?: Goal
  submitLabel: string
  onSubmit: (values: GoalFormValues) => Promise<void>
  onCancel?: () => void
}

export function GoalForm({ initial, submitLabel, onSubmit, onCancel }: GoalFormProps) {
  const [values, setValues] = useState<GoalFormValues>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    why: initial?.why ?? '',
    success_definition: initial?.success_definition ?? '',
    target_date: initial?.target_date ?? '',
    status: initial?.status ?? 'active',
  })
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof GoalFormValues>(key: K, value: GoalFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
        Goal name
        <input required value={values.name} onChange={(e) => set('name', e.target.value)} />
      </label>
      <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
        Description
        <textarea rows={2} value={values.description} onChange={(e) => set('description', e.target.value)} />
      </label>
      <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
        Why does this goal matter?
        <textarea rows={2} value={values.why} onChange={(e) => set('why', e.target.value)} />
      </label>
      <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
        Success definition
        <textarea
          rows={2}
          value={values.success_definition}
          onChange={(e) => set('success_definition', e.target.value)}
        />
      </label>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1 }}>
          Target date
          <input type="date" value={values.target_date} onChange={(e) => set('target_date', e.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: 'var(--space-1)', flex: 1 }}>
          Status
          <select value={values.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </label>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
