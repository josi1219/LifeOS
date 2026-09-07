import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import {
  Archive,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
  Clock,
  Code,
  Dumbbell,
  Edit2,
  GitBranch,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import './GoalsView.css'

interface MilestoneItem {
  id: string
  title: string
  dueDate: string
  progress: number
  completed: boolean
}

interface LinkedRoadmap {
  title: string
  skillsCount: number
  completedSkillsCount: number
  route: string
}

interface Goal {
  id: string
  title: string
  category: string
  description: string
  dueDate: string
  progress: number
  timeInvested: string
  totalTime: string
  status: 'active' | 'completed' | 'archived'
  icon: any
  linkedRoadmap: LinkedRoadmap
  milestones: MilestoneItem[]
}

export function GoalsView() {
  const navigate = useNavigate()

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 'ml',
      title: 'Become a Machine Learning Engineer',
      category: 'Career',
      description:
        'Master the core skills, build real projects, and gain hands-on experience to become a professional ML engineer.',
      dueDate: 'Dec 31, 2025',
      progress: 40,
      timeInvested: '124h 30m',
      totalTime: '310h',
      status: 'active',
      icon: Brain,
      linkedRoadmap: {
        title: 'ML Engineer Roadmap',
        skillsCount: 8,
        completedSkillsCount: 2,
        route: '/roadmap',
      },
      milestones: [
        {
          id: 'm1',
          title: 'Finish Python Basics',
          dueDate: 'Apr 25, 2025',
          progress: 100,
          completed: true,
        },
        {
          id: 'm2',
          title: 'Complete ML Fundamentals',
          dueDate: 'Jul 15, 2025',
          progress: 30,
          completed: false,
        },
        {
          id: 'm3',
          title: 'Build a Real Project',
          dueDate: 'Oct 30, 2025',
          progress: 0,
          completed: false,
        },
      ],
    },
    {
      id: 'trading',
      title: 'Build a Profitable Trading Strategy',
      category: 'Finance',
      description:
        'Learn ICT concepts, backtest, and develop a consistent trading strategy for forex/indices.',
      dueDate: 'Nov 30, 2025',
      progress: 25,
      timeInvested: '48h 12m',
      totalTime: '200h',
      status: 'active',
      icon: BarChart3,
      linkedRoadmap: {
        title: 'Algorithmic & Price Action Roadmap',
        skillsCount: 6,
        completedSkillsCount: 1,
        route: '/roadmap',
      },
      milestones: [
        {
          id: 't1',
          title: 'Backtest 100 Trades on Key Pairs',
          dueDate: 'Jun 30, 2025',
          progress: 75,
          completed: false,
        },
        {
          id: 't2',
          title: 'Establish Live Risk Management Rulebook',
          dueDate: 'Aug 15, 2025',
          progress: 0,
          completed: false,
        },
      ],
    },
    {
      id: 'health',
      title: 'Get in Shape & Build Healthy Habits',
      category: 'Health',
      description:
        'Workout regularly, eat clean, and build a sustainable healthy lifestyle.',
      dueDate: 'Dec 31, 2025',
      progress: 60,
      timeInvested: '72h 5m',
      totalTime: '120h',
      status: 'active',
      icon: Dumbbell,
      linkedRoadmap: {
        title: 'Fitness & Longevity Roadmap',
        skillsCount: 5,
        completedSkillsCount: 3,
        route: '/roadmap',
      },
      milestones: [
        {
          id: 'h1',
          title: 'Run 5km Under 25 Minutes',
          dueDate: 'May 10, 2025',
          progress: 100,
          completed: true,
        },
        {
          id: 'h2',
          title: 'Bodyweight Bench Press Milestone',
          dueDate: 'Sep 1, 2025',
          progress: 50,
          completed: false,
        },
      ],
    },
    {
      id: 'communication',
      title: 'Improve English & Communication',
      category: 'Personal',
      description:
        'Build strong English skills for better opportunities and confidence.',
      dueDate: 'Dec 15, 2025',
      progress: 35,
      timeInvested: '36h 20m',
      totalTime: '100h',
      status: 'active',
      icon: BookOpen,
      linkedRoadmap: {
        title: 'Public Speaking & Articulation',
        skillsCount: 4,
        completedSkillsCount: 1,
        route: '/roadmap',
      },
      milestones: [
        {
          id: 'c1',
          title: 'Read 5 Non-Fiction Books',
          dueDate: 'Jul 31, 2025',
          progress: 60,
          completed: false,
        },
        {
          id: 'c2',
          title: 'Deliver 3 Video Presentations',
          dueDate: 'Oct 15, 2025',
          progress: 0,
          completed: false,
        },
      ],
    },
    {
      id: 'web-dev',
      title: 'Learn Web Development Basics',
      category: 'Learning',
      description: 'Understand HTML, CSS, JavaScript and build small projects.',
      dueDate: 'Aug 31, 2025',
      progress: 100,
      timeInvested: '60h 0m',
      totalTime: '60h',
      status: 'completed',
      icon: Code,
      linkedRoadmap: {
        title: 'Frontend Foundations Roadmap',
        skillsCount: 6,
        completedSkillsCount: 6,
        route: '/roadmap',
      },
      milestones: [
        {
          id: 'w1',
          title: 'Build Responsive Portfolio Webpage',
          dueDate: 'Jun 1, 2025',
          progress: 100,
          completed: true,
        },
        {
          id: 'w2',
          title: 'Deploy Interactive JavaScript Mini-Apps',
          dueDate: 'Aug 20, 2025',
          progress: 100,
          completed: true,
        },
      ],
    },
  ])

  // Selected goal
  const [selectedGoalId, setSelectedGoalId] = useState('ml')
  const selectedGoal = goals.find((g) => g.id === selectedGoalId) || goals[0]

  // Modals state
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false)
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false)

  // Add Goal form fields
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Career')
  const [newDesc, setNewDesc] = useState('')
  const [newDueDate, setNewDueDate] = useState('Dec 31, 2025')
  const [newTotalTime, setNewTotalTime] = useState('100h')

  // Edit Goal form fields
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editTotalTime, setEditTotalTime] = useState('')

  // Filtered goals
  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  // Fetch real goals from backend on mount
  useEffect(() => {
    api
      .get<any[]>('/goals')
      .then((backendGoals) => {
        if (backendGoals && backendGoals.length > 0) {
          const mapped: Goal[] = backendGoals.map((bg) => {
            const cat = bg.department_name || 'Career'
            const iconComp =
              cat === 'Career' ? Brain : cat === 'Finance' ? BarChart3 : cat === 'Health' ? Dumbbell : BookOpen
            return {
              id: String(bg.id),
              title: bg.name,
              category: cat,
              description: bg.description || bg.why || 'Custom goal track with milestone objectives.',
              dueDate: bg.target_date
                ? new Date(bg.target_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Dec 31, 2025',
              progress: bg.progress || 0,
              timeInvested: '0h',
              totalTime: '100h',
              status: bg.status === 'completed' ? 'completed' : 'active',
              icon: iconComp,
              linkedRoadmap: {
                title: `${bg.name} Roadmap`,
                skillsCount: bg.milestones_count || 4,
                completedSkillsCount: bg.completed_milestones_count || 0,
                route: '/roadmap',
              },
              milestones: [],
            }
          })
          setGoals(mapped)
          setSelectedGoalId(mapped[0].id)
        }
      })
      .catch((err) => {
        console.error('Failed to load goals from backend', err)
      })
  }, [])

  const handleOpenEditModal = () => {
    if (!selectedGoal) return
    setEditTitle(selectedGoal.title)
    setEditCategory(selectedGoal.category)
    setEditDesc(selectedGoal.description)
    setEditDueDate(selectedGoal.dueDate)
    setEditTotalTime(selectedGoal.totalTime)
    setIsEditGoalModalOpen(true)
  }

  const handleSaveEditedGoal = async () => {
    if (!selectedGoal) return
    try {
      if (!isNaN(Number(selectedGoal.id))) {
        await api.patch('/goals/' + selectedGoal.id, {
          name: editTitle,
          description: editDesc,
        })
      }
    } catch (err) {
      console.error('Failed to save edited goal', err)
    }
    setGoals((prev) =>
      prev.map((g) =>
        g.id === selectedGoal.id
          ? {
              ...g,
              title: editTitle,
              category: editCategory,
              description: editDesc,
              dueDate: editDueDate,
              totalTime: editTotalTime,
            }
          : g
      )
    )
    setIsEditGoalModalOpen(false)
  }

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return
    if (window.confirm(`Are you sure you want to permanently delete "${selectedGoal.title}"?`)) {
      try {
        if (!isNaN(Number(selectedGoal.id))) {
          await api.delete('/goals/' + selectedGoal.id)
        }
      } catch (err) {
        console.error('Failed to delete goal', err)
      }
      const remaining = goals.filter((g) => g.id !== selectedGoal.id)
      setGoals(remaining)
      if (remaining.length > 0) {
        setSelectedGoalId(remaining[0].id)
      }
    }
  }

  const handleToggleArchiveGoal = async () => {
    if (!selectedGoal) return
    const nextStatus = selectedGoal.status === 'active' ? 'completed' : 'active'
    try {
      if (!isNaN(Number(selectedGoal.id))) {
        await api.patch('/goals/' + selectedGoal.id, { status: nextStatus })
      }
    } catch (err) {
      console.error('Failed to update status', err)
    }
    setGoals((prev) =>
      prev.map((g) =>
        g.id === selectedGoal.id
          ? { ...g, status: nextStatus, progress: nextStatus === 'completed' ? 100 : g.progress }
          : g
      )
    )
  }

  const handleCreateNewGoal = async () => {
    if (!newTitle.trim()) return
    let createdId = `goal-${Date.now()}`
    try {
      const created = await api.post<any>('/goals', {
        name: newTitle.trim(),
        description: newDesc.trim() || undefined,
        why: newDesc.trim() || undefined,
      })
      if (created && created.id) {
        createdId = String(created.id)
      }
    } catch (err) {
      console.error('Failed to create goal in backend', err)
    }

    const newGoalObj: Goal = {
      id: createdId,
      title: newTitle.trim(),
      category: newCategory,
      description: newDesc.trim() || 'Custom goal track with milestone objectives.',
      dueDate: newDueDate,
      progress: 0,
      timeInvested: '0h 0m',
      totalTime: newTotalTime,
      status: 'active',
      icon:
        newCategory === 'Career'
          ? Brain
          : newCategory === 'Finance'
          ? BarChart3
          : newCategory === 'Health'
          ? Dumbbell
          : BookOpen,
      linkedRoadmap: {
        title: `${newTitle.trim()} Roadmap`,
        skillsCount: 4,
        completedSkillsCount: 0,
        route: '/roadmap',
      },
      milestones: [
        {
          id: `m-${Date.now()}`,
          title: 'Initial Core Setup',
          dueDate: newDueDate,
          progress: 0,
          completed: false,
        },
      ],
    }

    setGoals((prev) => [newGoalObj, ...prev])
    setSelectedGoalId(newGoalObj.id)
    setNewTitle('')
    setNewDesc('')
    setIsAddGoalModalOpen(false)
  }

  // Mini donut calculation helper
  const renderMiniDonut = (pct: number, size = 44, stroke = 4) => {
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
        <span style={{ position: 'absolute', fontSize: size < 50 ? 10 : 13, fontWeight: 800, color: '#ffffff' }}>
          {pct}%
        </span>
      </div>
    )
  }

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
            <span>Goals</span>
          </button>

          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>Goals</div>
          <div style={{ fontSize: 11, color: '#8e95a5', marginTop: 1 }}>
            Set your destination. Break it down. Make it happen.
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddGoalModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0, 229, 153, 0.12)',
            border: '1px solid rgba(0, 229, 153, 0.3)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            fontSize: 11.5,
            fontWeight: 700,
            color: '#00e599',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 229, 153, 0.2)'
            e.currentTarget.style.borderColor = '#00e599'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 229, 153, 0.12)'
            e.currentTarget.style.borderColor = 'rgba(0, 229, 153, 0.3)'
          }}
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Add New Goal</span>
        </button>
      </div>

      {/* =========================================================
          MAIN 2-COLUMN WORKSPACE
          ========================================================= */}
      <div className="flow-goals-container">
        {/* LEFT COLUMN: ACTIVE & COMPLETED GOALS LIST */}
        <div className="flow-goals-main">
          {/* SECTION 1: Active Goals */}
          <div>
            <div className="flow-goals-section-title">
              <span className="flow-goals-dot" />
              <span>Active Goals</span>
              <span className="flow-goals-badge">{activeGoals.length}</span>
            </div>

            <div className="flow-goals-list">
              {activeGoals.map((goal) => {
                const Icon = goal.icon
                const isSelected = selectedGoal?.id === goal.id

                return (
                  <div
                    key={goal.id}
                    className={`flow-goal-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedGoalId(goal.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff' }}>{goal.title}</div>
                        <p
                          style={{
                            margin: '3px 0 6px',
                            fontSize: 11,
                            color: '#8e95a5',
                            lineHeight: 1.35,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 380,
                          }}
                        >
                          {goal.description}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="flow-category-pill">{goal.category}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8e95a5' }}>
                            <CalendarIcon size={11} color="#4e5564" />
                            <span>{goal.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Donut & Bars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                      {renderMiniDonut(goal.progress, 44, 4)}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 95 }}>
                        <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>
                          Overall Progress
                        </div>
                        <div style={{ height: 3.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${goal.progress}%`, height: '100%', background: '#00e599' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5, color: '#4e5564', marginTop: 1 }}>
                          <Clock size={9} />
                          <span>{goal.timeInvested}</span>
                        </div>
                      </div>

                      <ChevronRight size={14} color="#4e5564" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SECTION 2: Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <div className="flow-goals-section-title">
                <span className="flow-goals-dot" />
                <span>Completed Goals</span>
                <span className="flow-goals-badge">{completedGoals.length}</span>
              </div>

              <div className="flow-goals-list">
                {completedGoals.map((goal) => {
                  const Icon = goal.icon
                  const isSelected = selectedGoal?.id === goal.id

                  return (
                    <div
                      key={goal.id}
                      className={`flow-goal-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedGoalId(goal.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'rgba(0, 229, 153, 0.1)',
                            border: '1px solid rgba(0, 229, 153, 0.25)',
                            color: '#00e599',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={18} />
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff' }}>{goal.title}</div>
                          <p
                            style={{
                              margin: '3px 0 6px',
                              fontSize: 11,
                              color: '#8e95a5',
                              lineHeight: 1.35,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 380,
                            }}
                          >
                            {goal.description}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="flow-category-pill">{goal.category}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8e95a5' }}>
                              <CalendarIcon size={11} color="#4e5564" />
                              <span>{goal.dueDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 100% Complete Donut & Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                        {renderMiniDonut(100, 44, 4)}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 95 }}>
                          <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>
                            Overall Progress
                          </div>
                          <div style={{ height: 3.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: '100%', background: '#00e599' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5, color: '#4e5564', marginTop: 1 }}>
                            <Clock size={9} />
                            <span>{goal.timeInvested}</span>
                          </div>
                        </div>

                        <ChevronRight size={14} color="#4e5564" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: SELECTED GOAL DETAILS & ACTIONS */}
        {selectedGoal && (
          <aside className="flow-goals-sidebar">
            {/* Header: Icon, Title, Tags, Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <selectedGoal.icon size={18} />
                </div>

                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff', lineHeight: 1.25 }}>
                    {selectedGoal.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span className="flow-category-pill">{selectedGoal.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#8e95a5' }}>
                      <CalendarIcon size={10} color="#4e5564" />
                      <span>Due {selectedGoal.dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenEditModal}
                style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer', padding: 2 }}
              >
                <MoreHorizontal size={15} />
              </button>
            </div>

            {/* Large Progress Donut & Stats Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '70px 1fr',
                gap: 14,
                alignItems: 'center',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {renderMiniDonut(selectedGoal.progress, 62, 5.5)}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>
                    Overall Progress
                  </div>
                  <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
                    <div style={{ width: `${selectedGoal.progress}%`, height: '100%', background: '#00e599' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Invested</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', marginTop: 1 }}>{selectedGoal.timeInvested}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Total Time</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', marginTop: 1 }}>{selectedGoal.totalTime}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Description */}
            <div>
              <div style={{ fontSize: 10, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>
                Goal Description
              </div>
              <div style={{ fontSize: 11, color: '#8e95a5', lineHeight: 1.45 }}>{selectedGoal.description}</div>
            </div>

            {/* Linked Roadmap Card */}
            <div>
              <div style={{ fontSize: 10, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                Linked Roadmap
              </div>

              <div className="flow-linked-roadmap" onClick={() => navigate(selectedGoal.linkedRoadmap.route)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GitBranch size={14} />
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>{selectedGoal.linkedRoadmap.title}</div>
                    <div style={{ fontSize: 10, color: '#8e95a5', marginTop: 1 }}>
                      {selectedGoal.linkedRoadmap.skillsCount} skills • {selectedGoal.linkedRoadmap.completedSkillsCount}/
                      {selectedGoal.linkedRoadmap.skillsCount} completed
                    </div>
                  </div>
                </div>

                <ChevronRight size={13} color="#8e95a5" />
              </div>
            </div>

            {/* Milestones Stepper */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Milestones</span>
                <span style={{ fontSize: 10, color: '#8e95a5' }}>{selectedGoal.milestones.length} milestones</span>
              </div>

              <div className="flow-milestone-stepper">
                {selectedGoal.milestones.map((m, idx) => {
                  const isLast = idx === selectedGoal.milestones.length - 1
                  return (
                    <div key={m.id} className="flow-milestone-item">
                      <div className="flow-milestone-node-col">
                        <div className={`flow-milestone-node ${m.completed ? 'completed' : ''}`}>
                          {m.completed && <Check size={10} strokeWidth={3} />}
                        </div>
                        {!isLast && <div className={`flow-milestone-connector ${m.completed ? 'completed' : ''}`} />}
                      </div>

                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#ffffff', lineHeight: 1.2 }}>{m.title}</div>
                        <div style={{ fontSize: 9.5, color: '#4e5564', marginTop: 1 }}>Due {m.dueDate}</div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <div style={{ flex: 1, height: 3, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, overflow: 'hidden' }}>
                            <div style={{ width: `${m.progress}%`, height: '100%', background: '#00e599' }} />
                          </div>
                          <span style={{ fontSize: 9.5, color: '#8e95a5', minWidth: 24, textAlign: 'right' }}>{m.progress}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom Actions: Edit, Delete, Archive */}
            <div className="flow-actions-row">
              <button type="button" className="flow-action-btn" onClick={handleOpenEditModal}>
                <Edit2 size={11} />
                <span>Edit</span>
              </button>

              <button type="button" className="flow-action-btn delete" onClick={handleDeleteGoal}>
                <Trash2 size={11} />
                <span>Delete</span>
              </button>

              <button type="button" className="flow-action-btn" onClick={handleToggleArchiveGoal}>
                <Archive size={11} />
                <span>{selectedGoal.status === 'completed' ? 'Reactivate' : 'Archive'}</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* =========================================================
          MODALS
          ========================================================= */}

      {/* 1. Add New Goal Modal */}
      {isAddGoalModalOpen && (
        <div className="flow-modal-backdrop" onClick={() => setIsAddGoalModalOpen(false)}>
          <div className="flow-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Add New Goal</div>
              <button
                type="button"
                onClick={() => setIsAddGoalModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g., Master Mobile Development with Flutter"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Career">Career</option>
                    <option value="Finance">Finance</option>
                    <option value="Health">Health</option>
                    <option value="Personal">Personal</option>
                    <option value="Learning">Learning</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Target Date</label>
                  <input
                    type="text"
                    placeholder="Dec 31, 2025"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="What is the vision and why does it matter?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Estimated Total Hours</label>
                <input
                  type="text"
                  placeholder="e.g., 150h"
                  value={newTotalTime}
                  onChange={(e) => setNewTotalTime(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setIsAddGoalModalOpen(false)}
                style={{ background: 'transparent', color: '#8e95a5', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleCreateNewGoal}>
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Goal Modal */}
      {isEditGoalModalOpen && (
        <div className="flow-modal-backdrop" onClick={() => setIsEditGoalModalOpen(false)}>
          <div className="flow-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Edit Goal</div>
              <button
                type="button"
                onClick={() => setIsEditGoalModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Goal Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Career">Career</option>
                    <option value="Finance">Finance</option>
                    <option value="Health">Health</option>
                    <option value="Personal">Personal</option>
                    <option value="Learning">Learning</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Target Date</label>
                  <input
                    type="text"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Total Time</label>
                <input
                  type="text"
                  value={editTotalTime}
                  onChange={(e) => setEditTotalTime(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setIsEditGoalModalOpen(false)}
                style={{ background: 'transparent', color: '#8e95a5', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleSaveEditedGoal}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
