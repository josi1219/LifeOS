import { ChevronRight } from 'lucide-react'

export function ReflectionsView() {
  const reviews = [
    {
      week: 'Week 16 (Apr 14 - Apr 20, 2025)',
      status: 'Current Week',
      hoursLogged: '14h 20m',
      topSkill: 'Machine Learning',
      highlights: 'Completed Neural Networks backprop; created 2 milestone checkpoints.',
      active: true,
    },
    {
      week: 'Week 15 (Apr 7 - Apr 13, 2025)',
      status: 'Completed',
      hoursLogged: '18h 45m',
      topSkill: 'Web Development',
      highlights: 'Built authentication and database schemas; hit weekly target of 15 hours.',
      active: false,
    },
    {
      week: 'Week 14 (Mar 31 - Apr 6, 2025)',
      status: 'Completed',
      hoursLogged: '12h 10m',
      topSkill: 'Data Science',
      highlights: 'Reviewed quarterly goals; pruned low-priority tasks.',
      active: false,
    },
  ]

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Weekly Reflections & Review
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Review actual hours invested, adjust roadmaps, and set next week's focus intentions.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {reviews.map((r, i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: r.active ? '4px solid var(--color-accent)' : '1px solid var(--color-border)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>{r.week}</span>
                {r.active && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--color-accent)',
                      background: 'rgba(0, 229, 153, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      textTransform: 'uppercase',
                    }}
                  >
                    In Progress
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 6 }}>
                {r.highlights}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {r.hoursLogged}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 2 }}>
                  {r.topSkill}
                </div>
              </div>
              <ChevronRight size={18} color="var(--color-text-faint)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
