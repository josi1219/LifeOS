import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flag,
  Plus,
  Target,
  X,
} from 'lucide-react'
import './MilestonesView.css'

interface Milestone {
  id: string
  stepNumber: number
  title: string
  dueDate: string
  description: string
  relatedSkills: string[]
  progress: number
  status: 'completed' | 'in_progress' | 'not_started'
  skillsCompletedCount: number
  skillsTotalCount: number
}

interface GoalOption {
  id: string
  title: string
  totalMilestones: number
  completedMilestones: number
  progress: number
}

export function MilestonesView({ departmentId: _departmentId }: { departmentId?: number }) {
  const navigate = useNavigate()

  // Goals list for header switcher
  const [goals] = useState<GoalOption[]>([
    {
      id: 'ml',
      title: 'Become a Machine Learning Engineer',
      totalMilestones: 8,
      completedMilestones: 3,
      progress: 38,
    },
    {
      id: 'web',
      title: 'Build a Web Application',
      totalMilestones: 6,
      completedMilestones: 2,
      progress: 45,
    },
    {
      id: 'health',
      title: 'Improve Physical Health',
      totalMilestones: 5,
      completedMilestones: 1,
      progress: 20,
    },
  ])

  const [activeGoalId, setActiveGoalId] = useState('ml')
  const [isGoalDropdownOpen, setIsGoalDropdownOpen] = useState(false)
  const activeGoal = goals.find((g) => g.id === activeGoalId) || goals[0]

  // Filter state
  const [filterState, setFilterState] = useState<'Active' | 'Completed' | 'All'>('Active')
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)

  // Milestones list
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: 'm1',
      stepNumber: 1,
      title: 'Python Fundamentals',
      dueDate: 'Apr 25, 2025',
      description: 'Learn the basics of Python including syntax, variables, loops, functions and data structures.',
      relatedSkills: ['Python', 'Basic Programming'],
      progress: 100,
      status: 'completed',
      skillsCompletedCount: 2,
      skillsTotalCount: 2,
    },
    {
      id: 'm2',
      stepNumber: 2,
      title: 'Build a Web Application',
      dueDate: 'May 15, 2025',
      description: 'Learn how to build a simple web app using HTML, CSS, JavaScript and a backend framework.',
      relatedSkills: ['HTML', 'CSS', 'JavaScript', 'FastAPI'],
      progress: 45,
      status: 'in_progress',
      skillsCompletedCount: 4,
      skillsTotalCount: 8,
    },
    {
      id: 'm3',
      stepNumber: 3,
      title: 'Machine Learning Basics',
      dueDate: 'Jun 30, 2025',
      description: 'Understand ML concepts, data preprocessing, model training and evaluation.',
      relatedSkills: ['ML Basics', 'Data Preprocessing', 'Model Evaluation'],
      progress: 20,
      status: 'in_progress',
      skillsCompletedCount: 1,
      skillsTotalCount: 5,
    },
    {
      id: 'm4',
      stepNumber: 4,
      title: 'Deep Learning Fundamentals',
      dueDate: 'Aug 10, 2025',
      description: 'Learn neural networks, TensorFlow/PyTorch, and build basic deep learning models.',
      relatedSkills: ['Neural Networks', 'PyTorch', 'CNNs'],
      progress: 0,
      status: 'not_started',
      skillsCompletedCount: 0,
      skillsTotalCount: 6,
    },
    {
      id: 'm5',
      stepNumber: 5,
      title: 'Build a Portfolio Project',
      dueDate: 'Oct 1, 2025',
      description: 'Apply your skills to build a real project and deploy it online.',
      relatedSkills: ['Full Stack', 'Deployment', 'Git'],
      progress: 0,
      status: 'not_started',
      skillsCompletedCount: 0,
      skillsTotalCount: 5,
    },
  ])

  // Form states for creating a new milestone
  const [newTitle, setNewTitle] = useState('')
  const [newDeadline, setNewDeadline] = useState('Apr 30, 2025')
  const [newDesc, setNewDesc] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Machine Learning', 'Python'])
  const [isSkillPickerOpen, setIsSkillPickerOpen] = useState(false)

  // Available skills from roadmap to attach
  const availableRoadmapSkills = [
    'Python',
    'Machine Learning',
    'Neural Networks',
    'FastAPI',
    'Docker',
    'SQLAlchemy',
    'PyTorch',
    'Scikit-learn',
  ]

  const handleAddSkillToMilestone = (skillName: string) => {
    if (!selectedSkills.includes(skillName)) {
      setSelectedSkills([...selectedSkills, skillName])
    }
    setIsSkillPickerOpen(false)
  }

  const handleRemoveSkillFromMilestone = (skillName: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skillName))
  }

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newM: Milestone = {
      id: `m-${Date.now()}`,
      stepNumber: milestones.length + 1,
      title: newTitle.trim(),
      dueDate: newDeadline,
      description: newDesc.trim() || 'Custom targeted milestone connected to roadmap skills.',
      relatedSkills: selectedSkills.length > 0 ? selectedSkills : ['General'],
      progress: 0,
      status: 'not_started',
      skillsCompletedCount: 0,
      skillsTotalCount: selectedSkills.length || 1,
    }

    setMilestones([newM, ...milestones])
    setNewTitle('')
    setNewDesc('')
  }

  // Filtered milestones
  const filteredMilestones = milestones.filter((m) => {
    if (filterState === 'Active') return m.status !== 'completed'
    if (filterState === 'Completed') return m.status === 'completed'
    return true
  })

  // Mini donut calculation helper
  const renderDonut = (pct: number, size = 42, stroke = 4) => {
    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (pct / 100) * circumference

    return (
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#00e599"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span style={{ position: 'absolute', fontSize: 10, fontWeight: 800, color: '#ffffff' }}>{pct}%</span>
      </div>
    )
  }

  // Days setup for April 2025 (starts on Tuesday)
  const daysInApril = Array.from({ length: 30 }, (_, i) => i + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* =========================================================
          TOP BREADCRUMB / HEADER ROW
          ========================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'transparent',
              border: 'none',
              color: '#8e95a5',
              fontSize: 11.5,
              cursor: 'pointer',
              padding: 0,
              marginBottom: 2,
            }}
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>

          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>Milestones</div>
          <div style={{ fontSize: 11, color: '#8e95a5', marginTop: 1 }}>
            Set deadlines. Stay accountable. Turn your goals into real progress.
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN 2-COLUMN WORKSPACE
          ========================================================= */}
      <div className="flow-milestones-container">
        {/* LEFT COLUMN: HERO BANNER & MILESTONES LIST */}
        <div className="flow-milestones-main">
          {/* HERO BANNER: Current Goal Overview */}
          <div className="flow-milestones-hero">
            <div className="flow-milestones-hero-backdrop" />

            {/* Mountain Silhouette with Star */}
            <div className="flow-milestones-hero-silhouette">
              <svg viewBox="0 0 600 220" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="msRidge1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e2434" />
                    <stop offset="100%" stopColor="#080b12" />
                  </linearGradient>
                  <linearGradient id="msRidge2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#131926" />
                    <stop offset="100%" stopColor="#05070a" />
                  </linearGradient>
                </defs>
                <circle cx="440" cy="45" r="2.5" fill="#ffffff" filter="drop-shadow(0 0 6px #ffffff)" />
                <path d="M120,220 L260,90 L340,130 L450,45 L540,110 L600,60 L600,220 Z" fill="url(#msRidge1)" opacity="0.7" />
                <path d="M0,220 L100,140 L210,180 L320,110 L430,160 L520,95 L600,140 L600,220 Z" fill="url(#msRidge2)" />
              </svg>
            </div>

            <div className="flow-milestones-hero-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(0, 229, 153, 0.12)',
                    color: '#00e599',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(0, 229, 153, 0.25)',
                  }}
                >
                  <Target size={16} />
                </div>

                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#8e95a5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Current Goal
                  </div>

                  {/* Goal Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setIsGoalDropdownOpen(!isGoalDropdownOpen)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 18,
                        fontWeight: 800,
                        color: '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span>{activeGoal.title}</span>
                      <ChevronDown size={14} color="#8e95a5" />
                    </button>

                    {isGoalDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: 6,
                          background: 'var(--color-surface-elevated)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          zIndex: 60,
                          boxShadow: 'var(--shadow-md)',
                          minWidth: 260,
                          overflow: 'hidden',
                        }}
                      >
                        {goals.map((g) => (
                          <div
                            key={g.id}
                            onClick={() => {
                              setActiveGoalId(g.id)
                              setIsGoalDropdownOpen(false)
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: 12,
                              color: g.id === activeGoal.id ? '#00e599' : '#ffffff',
                              cursor: 'pointer',
                              background: g.id === activeGoal.id ? 'rgba(0, 229, 153, 0.08)' : 'transparent',
                            }}
                          >
                            {g.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11, color: '#8e95a5' }}>
                <span>{activeGoal.totalMilestones} milestones</span>
                <span>•</span>
                <span>{activeGoal.completedMilestones} completed</span>
                <span>•</span>
                <span>{activeGoal.totalMilestones - activeGoal.completedMilestones} remaining</span>
              </div>

              {/* Overall Progress Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, maxWidth: 360 }}>
                <div style={{ flex: 1, height: 4, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${activeGoal.progress}%`, height: '100%', background: '#00e599' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>{activeGoal.progress}%</span>
              </div>
            </div>

            {/* Right Quote */}
            <div className="flow-milestones-hero-quote">
              <div>"Small steps every day lead to big results."</div>
              <div style={{ marginTop: 4, color: 'var(--color-text-faint)' }}>——</div>
            </div>
          </div>

          {/* ALL MILESTONES LIST SECTION */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                <Flag size={15} color="#00e599" />
                <span>All Milestones</span>
              </div>

              {/* Filter Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 10px',
                    fontSize: 11,
                    color: '#8e95a5',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00e599' }} />
                  <span>{filterState}</span>
                  <ChevronDown size={11} />
                </button>

                {isFilterDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 4,
                      background: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      zIndex: 50,
                      minWidth: 100,
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    {(['Active', 'Completed', 'All'] as const).map((opt) => (
                      <div
                        key={opt}
                        onClick={() => {
                          setFilterState(opt)
                          setIsFilterDropdownOpen(false)
                        }}
                        style={{
                          padding: '6px 10px',
                          fontSize: 11,
                          color: filterState === opt ? '#00e599' : '#ffffff',
                          cursor: 'pointer',
                          background: filterState === opt ? 'rgba(0, 229, 153, 0.08)' : 'transparent',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flow-milestones-list">
              {filteredMilestones.map((m) => {
                const isCompleted = m.status === 'completed'

                return (
                  <div key={m.id} className={`flow-milestone-card ${isCompleted ? 'completed' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0 }}>
                      {/* Node circle */}
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: isCompleted ? '#00e599' : 'rgba(255, 255, 255, 0.04)',
                          color: isCompleted ? '#080b11' : '#8e95a5',
                          border: `1px solid ${isCompleted ? '#00e599' : 'rgba(255, 255, 255, 0.1)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11.5,
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {isCompleted ? <Check size={14} strokeWidth={3} /> : m.stepNumber}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff' }}>{m.title}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#8e95a5', marginTop: 2 }}>
                          <CalendarIcon size={11} color="#4e5564" />
                          <span>{m.dueDate}</span>
                        </div>

                        <p style={{ margin: '4px 0 6px', fontSize: 11, color: '#8e95a5', lineHeight: 1.35 }}>
                          {m.description}
                        </p>

                        {/* Related Skills Tags Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span className="flow-tag-label">Related Skills</span>
                          {m.relatedSkills.map((sk) => (
                            <span key={sk} className="flow-skill-pill">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Progress Donut & Progress Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                      {renderDonut(m.progress, 44, 4)}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 100 }}>
                        <div style={{ fontSize: 9.5, color: isCompleted ? '#00e599' : '#ffffff', fontWeight: 600 }}>
                          {isCompleted ? 'Completed' : m.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </div>

                        <div style={{ height: 3.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${m.progress}%`, height: '100%', background: '#00e599' }} />
                        </div>

                        <div style={{ fontSize: 9.5, color: '#4e5564' }}>
                          {m.skillsCompletedCount}/{m.skillsTotalCount} skills
                        </div>
                      </div>

                      <ChevronRight size={14} color="#4e5564" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: CREATE MILESTONE & CALENDAR VIEW */}
        <aside className="flow-milestones-sidebar">
          {/* Card 1: Create New Milestone Form */}
          <div className="flow-create-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
              <Plus size={14} color="#00e599" />
              <span>Create New Milestone</span>
            </div>

            <form onSubmit={handleCreateMilestone} style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#8e95a5', marginBottom: 3, fontWeight: 600 }}>
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning Project"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flow-create-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#8e95a5', marginBottom: 3, fontWeight: 600 }}>
                  Deadline
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="flow-create-input"
                    style={{ paddingLeft: 26 }}
                  />
                  <CalendarIcon size={12} color="#8e95a5" style={{ position: 'absolute', left: 8, top: 10 }} />
                </div>
              </div>

              {/* Related Skills Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#8e95a5', marginBottom: 4, fontWeight: 600 }}>
                  Related Skills
                </label>

                {/* Selected Skills Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {selectedSkills.map((sk) => (
                    <span
                      key={sk}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(0, 229, 153, 0.1)',
                        border: '1px solid rgba(0, 229, 153, 0.25)',
                        color: '#00e599',
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      <span>{sk}</span>
                      <X
                        size={10}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemoveSkillFromMilestone(sk)}
                      />
                    </span>
                  ))}
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsSkillPickerOpen(!isSkillPickerOpen)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '5px',
                      color: '#8e95a5',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={11} />
                    <span>Add Skill</span>
                  </button>

                  {isSkillPickerOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        background: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        zIndex: 50,
                        maxHeight: 140,
                        overflowY: 'auto',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      {availableRoadmapSkills.map((sk) => (
                        <div
                          key={sk}
                          onClick={() => handleAddSkillToMilestone(sk)}
                          style={{
                            padding: '6px 10px',
                            fontSize: 11,
                            color: selectedSkills.includes(sk) ? '#00e599' : '#ffffff',
                            cursor: 'pointer',
                            background: selectedSkills.includes(sk) ? 'rgba(0, 229, 153, 0.08)' : 'transparent',
                          }}
                        >
                          {sk}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#8e95a5', marginBottom: 3, fontWeight: 600 }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Add a short description..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="flow-create-input"
                />
              </div>

              <button type="submit" className="flow-submit-btn">
                Create Milestone
              </button>
            </form>
          </div>

          {/* Card 2: Calendar View */}
          <div className="flow-create-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
              <CalendarIcon size={14} color="#00e599" />
              <span>Calendar View</span>
            </div>

            {/* Subheader */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#8e95a5' }}>April 2025</span>
              <div style={{ display: 'flex', gap: 2 }}>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', padding: 2, color: '#4e5564', cursor: 'pointer' }}
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', padding: 2, color: '#4e5564', cursor: 'pointer' }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                fontSize: 9.5,
                color: '#4e5564',
                fontWeight: 700,
              }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Grid Days */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 2,
                textAlign: 'center',
                fontSize: 10.5,
              }}
            >
              {/* Blank offset for Tue 1 */}
              <div />
              <div />

              {daysInApril.map((d) => {
                const isDay8 = d === 8
                return (
                  <div
                    key={d}
                    style={{
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: isDay8 ? '#00e599' : 'transparent',
                      color: isDay8 ? '#080b11' : '#8e95a5',
                      fontWeight: isDay8 ? 800 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {d}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 6,
                paddingTop: 8,
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00e599' }} />
                <span style={{ color: '#8e95a5' }}>Milestone</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#8b5cf6' }} />
                <span style={{ color: '#8e95a5' }}>Today</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f43f5e' }} />
                <span style={{ color: '#8e95a5' }}>Overdue</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
