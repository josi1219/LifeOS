import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import {
  ArrowLeft,
  Brain,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  Edit2,
  Edit3,
  Flag,
  Layers,
  Layout,
  Play,
  Plus,
  Target,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import { useTimer } from '../features/timer/TimerContext'
import './RoadmapView.css'

interface SubSkill {
  id: string
  name: string
  description: string
  isMain?: boolean
  status: 'completed' | 'in_progress' | 'not_started'
  totalHours: string
  investedHours: string
  progress: number
  icon: any
}

interface RoadmapStep {
  id: string
  stepNumber: number
  name: string
  description: string
  status: 'completed' | 'in_progress' | 'not_started'
  progress: number
  investedHours: string
  totalHours: string
  tags: string[]
  icon: any
  subSkills: SubSkill[]
  relatedMilestones?: { title: string; date: string; progress: number }[]
}

interface GoalData {
  id: string
  title: string
  description: string
  targetDate: string
  totalProgress: number
  timeInvested: string
  steps: RoadmapStep[]
}

export function RoadmapView({ departmentId: _departmentId }: { departmentId?: number }) {
  const navigate = useNavigate()
  const { startTimer } = useTimer()

  // View mode: 'roadmap' (Main Timeline) or 'skill-detail' (Expanded Skill & Sub-Skills)
  const [viewMode, setViewMode] = useState<'roadmap' | 'skill-detail'>('roadmap')
  const [selectedSkillId, setSelectedSkillId] = useState('')
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null)

  // Modals & dropdowns
  const [isGoalDropdownOpen, setIsGoalDropdownOpen] = useState(false)
  const [isViewAsListOpen, setIsViewAsListOpen] = useState(false)
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false)
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false)
  const [isAddSubSkillModalOpen, setIsAddSubSkillModalOpen] = useState(false)

  // Edit Goal form state
  const [goalTitle, setGoalTitle] = useState('Become a Machine Learning Engineer')
  const [goalDesc, setGoalDesc] = useState(
    'Master the core skills, build real projects, and gain hands-on experience to become a professional ML engineer.'
  )
  const [goalTargetDate, setGoalTargetDate] = useState('Dec 31, 2025')

  // New Step form state
  const [newStepName, setNewStepName] = useState('')
  const [newStepDesc, setNewStepDesc] = useState('')
  const [newStepHours, setNewStepHours] = useState('40')

  // New Sub-Skill form state
  const [newSubSkillName, setNewSubSkillName] = useState('')
  const [newSubSkillDesc, setNewSubSkillDesc] = useState('')
  const [newSubSkillHours, setNewSubSkillHours] = useState('10')

  // Goals Catalog with unique, distinct sub-skills per step
  const [goals, setGoals] = useState<GoalData[]>([])

  const [activeGoalId, setActiveGoalId] = useState('ml')
  const [activeRoadmapId, setActiveRoadmapId] = useState<number | null>(null)
  const activeGoal = goals.find((g) => g.id === activeGoalId) || goals[0] || null
  const activeSkill = activeGoal?.steps?.find((s) => s.id === selectedSkillId) || activeGoal?.steps?.[0] || null


  // Load real goals from backend
  useEffect(() => {
    api
      .get<any[]>('/goals')
      .then((bgGoals) => {
        if (bgGoals && bgGoals.length > 0) {
          const mapped: GoalData[] = bgGoals.map((bg) => ({
            id: String(bg.id),
            title: bg.name,
            description: bg.description || bg.why || 'Custom goal track with roadmap milestones.',
            targetDate: bg.target_date
              ? new Date(bg.target_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Dec 31, 2025',
            totalProgress: bg.progress || 0,
            timeInvested: '0h',
            steps: [],
          }))
          setGoals(mapped)
          setActiveGoalId(mapped[0].id)
        }
      })
      .catch(() => {})
  }, [])

  // Load real roadmap tree when activeGoalId changes
  useEffect(() => {
    if (!activeGoalId || isNaN(Number(activeGoalId))) return
    api
      .get<any>(`/goals/${activeGoalId}/roadmap`)
      .then((data) => {
        if (data && data.roadmap) {
          setActiveRoadmapId(data.roadmap.id)
          if (data.items && data.items.length > 0) {
            const mappedSteps: RoadmapStep[] = data.items.map((item: any, idx: number) => ({
              id: String(item.id),
              stepNumber: idx + 1,
              name: item.name,
              description: item.description || '',
              status: item.status || 'not_started',
              progress: item.progress || 0,
              investedHours: '0h',
              totalHours: item.estimated_hours ? `${item.estimated_hours}h` : '20h',
              tags: [item.name.split(' ')[0] || 'Skill', 'Core'],
              icon: idx % 2 === 0 ? Brain : Code,
              subSkills: (item.children || []).map((ch: any) => ({
                id: String(ch.id),
                name: ch.name,
                description: ch.description || '',
                isMain: true,
                status: ch.status || 'not_started',
                totalHours: ch.estimated_hours ? `${ch.estimated_hours}h` : '10h',
                investedHours: '0h',
                progress: ch.progress || 0,
                icon: Code,
              })),
            }))
            setGoals((prev) =>
              prev.map((g) =>
                g.id === activeGoalId
                  ? {
                      ...g,
                      totalProgress: data.progress || 0,
                      steps: mappedSteps,
                    }
                  : g
              )
            )
            if (mappedSteps.length > 0) {
              setSelectedSkillId(mappedSteps[0].id)
            }
          }
        }
      })
      .catch(() => {})
  }, [activeGoalId])

  const handleOpenSkill = (skillId: string) => {
    setSelectedSkillId(skillId)
    setViewMode('skill-detail')
  }

  const handleStartFocusFromSubSkill = async (subSkillName: string, subSkillId?: string) => {
    const sId = subSkillId && !isNaN(Number(subSkillId)) ? Number(subSkillId) : undefined
    const gId = activeGoal && !isNaN(Number(activeGoal.id)) ? Number(activeGoal.id) : undefined
    try {
      await startTimer({
        goal_id: gId,
        roadmap_item_id: sId,
        note: `Focusing on ${activeSkill?.name || 'Skill'} - ${subSkillName}`,
      })
    } catch {
      // ignore
    }
    navigate('/focus')
  }

  const handleSaveGoal = async () => {
    if (!isNaN(Number(activeGoal.id))) {
      try {
        await api.patch('/goals/' + activeGoal.id, {
          name: goalTitle,
          description: goalDesc,
        })
      } catch (err) {
        console.error('Failed to update goal in backend', err)
      }
    }
    setGoals((prev) =>
      prev.map((g) =>
        g.id === activeGoal.id
          ? { ...g, title: goalTitle, description: goalDesc, targetDate: goalTargetDate }
          : g
      )
    )
    setIsEditGoalModalOpen(false)
  }

  const handleAddStep = async () => {
    if (!newStepName.trim()) return
    let stepId = `step-${Date.now()}`
    if (activeRoadmapId) {
      try {
        const created = await api.post<any>(`/roadmaps/${activeRoadmapId}/items`, {
          name: newStepName.trim(),
          description: newStepDesc.trim() || undefined,
          estimated_hours: Number(newStepHours) || 20,
        })
        if (created && created.id) stepId = String(created.id)
      } catch (err) {
        console.error('Failed to create roadmap step in backend', err)
      }
    }

    const newStep: RoadmapStep = {
      id: stepId,
      stepNumber: (activeGoal.steps?.length || 0) + 1,
      name: newStepName.trim(),
      description: newStepDesc.trim() || 'Core milestones and practical exercises.',
      status: 'not_started',
      progress: 0,
      investedHours: '0h',
      totalHours: `${newStepHours}h`,
      tags: [newStepName.split(' ')[0] || 'Skill', 'Core'],
      icon: Brain,
      subSkills: [],
    }

    setGoals((prev) =>
      prev.map((g) => (g.id === activeGoal.id ? { ...g, steps: [...g.steps, newStep] } : g))
    )
    setNewStepName('')
    setNewStepDesc('')
    setNewStepHours('40')
    setIsAddStepModalOpen(false)
  }

  const handleAddSubSkill = async () => {
    if (!newSubSkillName.trim()) return
    const stepTotalHours = activeSkill ? parseFloat(activeSkill.totalHours) || 20 : 20
    const currentAllocated = activeSkill ? activeSkill.subSkills.reduce((acc, s) => acc + (parseFloat(s.totalHours) || 0), 0) : 0
    const remainingHours = Math.max(0, stepTotalHours - currentAllocated)
    const requestedHours = Number(newSubSkillHours) || 0

    if (requestedHours > remainingHours) {
      window.alert(`Sub-skills total allocated hours cannot exceed the step's total allocated hours (${stepTotalHours}h). Remaining available: ${remainingHours}h.`)
      return
    }

    let subId = `sub-${Date.now()}`
    if (activeRoadmapId && activeSkill && !isNaN(Number(activeSkill.id))) {
      try {
        const created = await api.post<any>(`/roadmaps/${activeRoadmapId}/items`, {
          name: newSubSkillName.trim(),
          description: newSubSkillDesc.trim() || undefined,
          parent_id: Number(activeSkill.id),
          estimated_hours: requestedHours || 10,
        })
        if (created && created.id) subId = String(created.id)
      } catch (err: any) {
        console.error('Failed to create sub-skill in backend', err)
        window.alert(err?.message || 'Failed to create sub-skill in backend')
        return
      }
    }

    const newSub: SubSkill = {
      id: subId,
      name: newSubSkillName.trim(),
      description: newSubSkillDesc.trim() || 'Direct focus unit and practical application.',
      status: 'not_started',
      totalHours: `${newSubSkillHours}h`,
      investedHours: '0h',
      progress: 0,
      icon: Code,
    }

    setGoals((prev) =>
      prev.map((g) =>
        g.id === activeGoal.id
          ? {
              ...g,
              steps: g.steps.map((s) =>
                s.id === activeSkill.id ? { ...s, subSkills: [...s.subSkills, newSub] } : s
              ),
            }
          : g
      )
    )
    setNewSubSkillName('')
    setNewSubSkillDesc('')
    setNewSubSkillHours('10')
    setIsAddSubSkillModalOpen(false)
  }

  if (!activeGoal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ color: '#8e95a5', padding: 20 }}>No roadmap available for this goal.</div>
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
          {viewMode === 'roadmap' ? (
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
          ) : (
            <button
              type="button"
              onClick={() => setViewMode('roadmap')}
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
              <span>Back to Roadmap</span>
            </button>
          )}

          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
            {viewMode === 'roadmap' ? 'Roadmap' : activeSkill.name}
          </div>
          <div style={{ fontSize: 11, color: '#8e95a5', marginTop: 1 }}>
            {viewMode === 'roadmap'
              ? 'Follow the steps. Build the skills. Reach your goal.'
              : activeSkill.description}
          </div>
        </div>
      </div>

      {/* =========================================================
          VIEW 1: MAIN ROADMAP VIEW (Matching media_1788788069687.png)
          ========================================================= */}
      {viewMode === 'roadmap' && (
        <div className="flow-roadmap-container">
          {/* LEFT MAIN STREAM */}
          <div className="flow-roadmap-main">
            {/* HERO BANNER: Current Goal */}
            <div className="flow-roadmap-hero">
              <div className="flow-roadmap-hero-backdrop" />

              {/* Mountain Silhouette with Star */}
              <div className="flow-roadmap-hero-silhouette">
                <svg viewBox="0 0 600 220" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="roadRidge1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e2434" />
                      <stop offset="100%" stopColor="#080b12" />
                    </linearGradient>
                    <linearGradient id="roadRidge2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#131926" />
                      <stop offset="100%" stopColor="#05070a" />
                    </linearGradient>
                  </defs>
                  {/* Star */}
                  <circle cx="450" cy="45" r="2.5" fill="#ffffff" filter="drop-shadow(0 0 6px #ffffff)" />
                  <path d="M120,220 L260,90 L340,130 L450,45 L540,110 L600,60 L600,220 Z" fill="url(#roadRidge1)" opacity="0.7" />
                  <path d="M0,220 L100,140 L210,180 L320,110 L430,160 L520,95 L600,140 L600,220 Z" fill="url(#roadRidge2)" />
                </svg>
              </div>

              <div className="flow-roadmap-hero-content">
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
                    {/* Goal Switcher Dropdown */}
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

                <p style={{ margin: '8px 0 12px', fontSize: 11.5, color: '#8e95a5', lineHeight: 1.45, maxWidth: 460 }}>
                  {activeGoal.description}
                </p>

                {/* Metrics Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '5px 9px',
                    }}
                  >
                    <Clock size={12} color="#4e5564" />
                    <div>
                      <div style={{ fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Target Date</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>{activeGoal.targetDate}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '5px 9px',
                    }}
                  >
                    <CheckCircle2 size={12} color="#4e5564" />
                    <div>
                      <div style={{ fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Total Progress</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>{activeGoal.totalProgress}%</div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '5px 9px',
                    }}
                  >
                    <Zap size={12} color="#4e5564" />
                    <div>
                      <div style={{ fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Time Invested</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>{activeGoal.timeInvested}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Goal Button */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <button
                  type="button"
                  onClick={() => {
                    setGoalTitle(activeGoal.title)
                    setGoalDesc(activeGoal.description)
                    setGoalTargetDate(activeGoal.targetDate)
                    setIsEditGoalModalOpen(true)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 14px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Edit2 size={12} />
                  <span>Edit Goal</span>
                </button>
              </div>
            </div>

            {/* ROADMAP TIMELINE SECTION */}
            <div className="flow-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Brain size={14} color="#00e599" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Roadmap (Skills)</div>
                    <div style={{ fontSize: 10.5, color: '#8e95a5' }}>Click any skill to view and focus on its sub-skills.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setIsViewAsListOpen(!isViewAsListOpen)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11,
                        color: '#8e95a5',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '4px 9px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      <Layout size={11} />
                      <span>View as List</span>
                      <ChevronDown size={10} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddStepModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#ffffff',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      padding: '4px 11px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={12} />
                    <span>Add Step</span>
                  </button>
                </div>
              </div>

              {/* Connected Vertical Stepper (Steps = Skills) */}
              <div className="flow-stepper-list">
                {activeGoal.steps.map((step, idx) => {
                  const isLast = idx === activeGoal.steps.length - 1
                  const isCompleted = step.status === 'completed'
                  const isInProgress = step.status === 'in_progress'

                  const Icon = step.icon

                  return (
                    <div
                      key={step.id}
                      className="flow-step-item"
                      draggable
                      onDragStart={() => setDraggedStepId(step.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async () => {
                        if (!draggedStepId || draggedStepId === step.id) return
                        const draggedIdx = activeGoal.steps.findIndex((s) => s.id === draggedStepId)
                        const targetIdx = idx
                        if (draggedIdx < 0) return

                        const newSteps = [...activeGoal.steps]
                        const [removed] = newSteps.splice(draggedIdx, 1)
                        newSteps.splice(targetIdx, 0, removed)

                        setGoals((prev) =>
                          prev.map((g) =>
                            g.id === activeGoal.id ? { ...g, steps: newSteps } : g
                          )
                        )
                        setDraggedStepId(null)

                        if (activeRoadmapId) {
                          try {
                            const newOrderedIds = newSteps.map((s) => Number(s.id)).filter((id) => !isNaN(id))
                            await api.patch(`/roadmaps/${activeRoadmapId}/items/reorder`, { ordered_ids: newOrderedIds })
                          } catch (err) {
                            console.error('Failed to reorder steps', err)
                          }
                        }
                      }}
                    >
                      {/* Timeline Column with Nodes and Downward Arrows */}
                      <div className="flow-step-line-col">
                        <div
                          className={`flow-step-node ${
                            isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'not-started'
                          }`}
                        >
                          {isCompleted ? <Check size={14} strokeWidth={3} /> : step.stepNumber}
                        </div>

                        {!isLast && (
                          <div className={`flow-step-connector ${isCompleted ? 'completed' : ''}`}>
                            <div className="flow-step-connector-arrow">
                              <ChevronDown size={11} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Step Card: Clicking enters Skill View */}
                      <div className="flow-step-card" onClick={() => handleOpenSkill(step.id)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 'var(--radius-sm)',
                                background: isCompleted
                                  ? 'rgba(0, 229, 153, 0.12)'
                                  : isInProgress
                                  ? 'rgba(139, 92, 246, 0.15)'
                                  : 'rgba(255, 255, 255, 0.04)',
                                color: isCompleted ? '#00e599' : isInProgress ? '#8b5cf6' : '#8e95a5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: 2,
                              }}
                            >
                              <Icon size={16} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff' }}>{step.name}</span>
                                <span style={{ fontSize: 10, color: '#00e599', background: 'rgba(0, 229, 153, 0.08)', padding: '1px 6px', borderRadius: 4 }}>
                                  {step.subSkills.length} sub-skills
                                </span>
                              </div>
                              <p style={{ margin: '3px 0 6px', fontSize: 11, color: '#8e95a5', lineHeight: 1.4 }}>
                                {step.description}
                              </p>
                              {/* Tag Pills */}
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {step.tags.map((tag) => (
                                  <span key={tag} className="flow-tag-pill">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge, Progress Bar & Time */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                            <span
                              onClick={async (e) => {
                                e.stopPropagation()
                                const nextStatus = step.status === 'not_started' ? 'in_progress' 
                                  : step.status === 'in_progress' ? 'completed' : 'not_started'
                                const nextProgress = nextStatus === 'completed' ? 100 : nextStatus === 'in_progress' ? 50 : 0
                                try {
                                  if (!isNaN(Number(step.id))) {
                                    await api.patch('/roadmap-items/' + step.id, { status: nextStatus, progress: nextProgress })
                                  }
                                } catch (err) {
                                  console.error('Failed to update status', err)
                                }
                                setGoals(prev => prev.map(g =>
                                  g.id === activeGoalId
                                    ? { ...g, steps: g.steps.map(s => s.id === step.id ? { ...s, status: nextStatus, progress: nextProgress } : s) }
                                    : g
                                ))
                              }}
                              style={{
                                cursor: 'pointer',
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                background: isCompleted
                                  ? 'rgba(0, 229, 153, 0.12)'
                                  : isInProgress
                                  ? 'rgba(139, 92, 246, 0.15)'
                                  : 'rgba(255, 255, 255, 0.04)',
                                color: isCompleted ? '#00e599' : isInProgress ? '#8b5cf6' : '#8e95a5',
                                border: `1px solid ${
                                  isCompleted
                                    ? 'rgba(0, 229, 153, 0.25)'
                                    : isInProgress
                                    ? 'rgba(139, 92, 246, 0.25)'
                                    : 'rgba(255, 255, 255, 0.06)'
                                }`,
                              }}
                            >
                              {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 68, height: 4, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${step.progress}%`,
                                    height: '100%',
                                    background: isCompleted ? '#00e599' : isInProgress ? '#8b5cf6' : 'transparent',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#ffffff', minWidth: 26, textAlign: 'right' }}>
                                {step.progress}%
                              </span>
                              <ChevronRight size={13} color="#4e5564" />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4e5564' }}>
                              <Clock size={10} />
                              <span>{step.investedHours} / {step.totalHours}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR STREAM */}
          <aside className="flow-roadmap-sidebar">
            {/* Goal Details Card */}
            <div className="flow-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <Target size={14} color="#00e599" />
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff' }}>Goal Details</span>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Title</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>{activeGoal.title}</div>
                </div>

                <div>
                  <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Description</div>
                  <div style={{ fontSize: 11, color: '#8e95a5', lineHeight: 1.4, marginTop: 2 }}>
                    {activeGoal.description}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Target Date</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#ffffff', fontWeight: 600, marginTop: 2 }}>
                    <CalendarIcon size={12} color="#8e95a5" />
                    <span>{activeGoal.targetDate}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Overall Progress</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${activeGoal.totalProgress}%`, height: '100%', background: '#00e599' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>{activeGoal.totalProgress}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="flow-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <Layout size={14} color="#8b5cf6" />
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff' }}>Quick Actions</span>
              </div>

              <div style={{ display: 'grid', gap: 7 }}>
                <button
                  type="button"
                  onClick={() => {
                    setGoalTitle(activeGoal.title)
                    setGoalDesc(activeGoal.description)
                    setGoalTargetDate(activeGoal.targetDate)
                    setIsEditGoalModalOpen(true)
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#ffffff',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Edit2 size={13} color="#8e95a5" />
                  <span>Edit Roadmap</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddStepModalOpen(true)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#ffffff',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} color="#8e95a5" />
                  <span>Add Step</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/calendar')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#ffffff',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <CalendarIcon size={13} color="#8e95a5" />
                  <span>View in Calendar</span>
                </button>
              </div>
            </div>

            {/* Bottom Quote */}
            <div style={{ textAlign: 'right', fontSize: 10.5, color: '#4e5564', fontStyle: 'italic', paddingRight: 4 }}>
              "Small steps every day lead to big results." ——
            </div>
          </aside>
        </div>
      )}

      {/* =========================================================
          VIEW 2: EXPANDED SKILL VIEW (Showing its actual sub-skills!)
          ========================================================= */}
      {viewMode === 'skill-detail' && (
        activeSkill ? (
        <div className="flow-roadmap-container">
          {/* LEFT MAIN STREAM */}
          <div className="flow-roadmap-main">
            {/* HERO BANNER: Active Skill Overview */}
            <div className="flow-roadmap-hero">
              <div className="flow-roadmap-hero-backdrop" />

              <div className="flow-roadmap-hero-silhouette">
                <svg viewBox="0 0 600 220" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="skRidge1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e2434" />
                      <stop offset="100%" stopColor="#080b12" />
                    </linearGradient>
                    <linearGradient id="skRidge2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#131926" />
                      <stop offset="100%" stopColor="#05070a" />
                    </linearGradient>
                  </defs>
                  <circle cx="430" cy="50" r="2.5" fill="#ffffff" filter="drop-shadow(0 0 6px #ffffff)" />
                  <path d="M120,220 L260,90 L340,130 L450,45 L540,110 L600,60 L600,220 Z" fill="url(#skRidge1)" opacity="0.7" />
                  <path d="M0,220 L100,140 L210,180 L320,110 L430,160 L520,95 L600,140 L600,220 Z" fill="url(#skRidge2)" />
                </svg>
              </div>

              <div className="flow-roadmap-hero-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Skill Badge Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 229, 153, 0.1)',
                      border: '1px solid rgba(0, 229, 153, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00e599',
                      flexShrink: 0,
                    }}
                  >
                    <activeSkill.icon size={22} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 21, fontWeight: 800, color: '#ffffff' }}>{activeSkill.name}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: activeSkill.status === 'completed' ? 'rgba(0, 229, 153, 0.12)' : 'rgba(139, 92, 246, 0.15)',
                          color: activeSkill.status === 'completed' ? '#00e599' : '#8b5cf6',
                          border: `1px solid ${activeSkill.status === 'completed' ? 'rgba(0, 229, 153, 0.25)' : 'rgba(139, 92, 246, 0.25)'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: activeSkill.status === 'completed' ? '#00e599' : '#8b5cf6' }} />
                        <span>{activeSkill.status === 'completed' ? 'Completed' : 'In Progress'}</span>
                      </span>
                    </div>

                    <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#8e95a5', lineHeight: 1.4, maxWidth: 460 }}>
                      {activeSkill.description}
                    </p>
                  </div>
                </div>

                {/* Stat Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '5px 9px',
                    }}
                  >
                    <Clock size={12} color="#4e5564" />
                    <div>
                      <div style={{ fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Total Time</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>{activeSkill.totalHours}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '5px 9px',
                    }}
                  >
                    <Zap size={12} color="#4e5564" />
                    <div>
                      <div style={{ fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Time Invested</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>{activeSkill.investedHours}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '5px 9px',
                    }}
                  >
                    <CheckCircle2 size={12} color="#4e5564" />
                    <div>
                      <div style={{ fontSize: 8.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Progress</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>{activeSkill.progress}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SUB SKILLS SECTION (Direct Learning Units) */}
            <div className="flow-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Layers size={14} color="#00e599" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                      Sub-Skills for {activeSkill.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#8e95a5' }}>
                      Core competencies to master. Complete them one by one or launch a focus session.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsAddSubSkillModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#ffffff',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      padding: '4px 11px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={12} />
                    <span>Add Sub Skill</span>
                  </button>
                </div>
              </div>

              {/* Connected Stepper with Sub-Skills */}
              <div className="flow-stepper-list">
                {activeSkill.subSkills.map((sub, idx) => {
                  const isLast = idx === activeSkill.subSkills.length - 1
                  const isCompleted = sub.status === 'completed'
                  const isInProgress = sub.status === 'in_progress'

                  const Icon = sub.icon

                  return (
                    <div key={sub.id} className="flow-step-item">
                      {/* Left Stepper Line with Numbers & Arrows */}
                      <div className="flow-step-line-col">
                        <div
                          className={`flow-step-node ${
                            isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'not-started'
                          }`}
                        >
                          {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                        </div>

                        {!isLast && (
                          <div className={`flow-step-connector ${isCompleted ? 'completed' : ''}`}>
                            <div className="flow-step-connector-arrow">
                              <ChevronDown size={11} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sub-skill Card (Direct Focus Item) */}
                      <div className="flow-subskill-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 'var(--radius-sm)',
                                background: isCompleted
                                  ? 'rgba(0, 229, 153, 0.12)'
                                  : isInProgress
                                  ? 'rgba(139, 92, 246, 0.15)'
                                  : 'rgba(255, 255, 255, 0.04)',
                                color: isCompleted ? '#00e599' : isInProgress ? '#8b5cf6' : '#8e95a5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              <Icon size={15} />
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{sub.name}</span>
                                {sub.isMain && (
                                  <span
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 700,
                                      color: '#00e599',
                                      background: 'rgba(0, 229, 153, 0.1)',
                                      border: '1px solid rgba(0, 229, 153, 0.25)',
                                      padding: '1px 6px',
                                      borderRadius: 'var(--radius-full)',
                                    }}
                                  >
                                    Main
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: '#8e95a5', marginTop: 2, lineHeight: 1.35 }}>
                                {sub.description}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge & Start Focus Action Button */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span
                              onClick={async (e) => {
                                e.stopPropagation()
                                const nextStatus = sub.status === 'not_started' ? 'in_progress' 
                                  : sub.status === 'in_progress' ? 'completed' : 'not_started'
                                const nextProgress = nextStatus === 'completed' ? 100 : nextStatus === 'in_progress' ? 50 : 0
                                try {
                                  if (!isNaN(Number(sub.id))) {
                                    await api.patch('/roadmap-items/' + sub.id, { status: nextStatus, progress: nextProgress })
                                  }
                                } catch (err) {
                                  console.error('Failed to update status', err)
                                }
                                setGoals(prev => prev.map(g =>
                                  g.id === activeGoalId
                                    ? { ...g, steps: g.steps.map(s => s.id === activeSkill.id
                                        ? { ...s, subSkills: s.subSkills.map(ss => ss.id === sub.id ? { ...ss, status: nextStatus, progress: nextProgress } : ss) }
                                        : s
                                      )}
                                    : g
                                ))
                              }}
                              style={{
                                cursor: 'pointer',
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                background: isCompleted
                                  ? 'rgba(0, 229, 153, 0.12)'
                                  : isInProgress
                                  ? 'rgba(139, 92, 246, 0.15)'
                                  : 'rgba(255, 255, 255, 0.04)',
                                color: isCompleted ? '#00e599' : isInProgress ? '#8b5cf6' : '#8e95a5',
                                border: `1px solid ${
                                  isCompleted
                                    ? 'rgba(0, 229, 153, 0.25)'
                                    : isInProgress
                                    ? 'rgba(139, 92, 246, 0.25)'
                                    : 'rgba(255, 255, 255, 0.06)'
                                }`,
                              }}
                            >
                              {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                            </span>

                            {/* Direct Start Focus Trigger */}
                            <button
                              type="button"
                              onClick={() => handleStartFocusFromSubSkill(sub.name, sub.id)}
                              className="flow-focus-pill-btn"
                              title={`Focus on ${sub.name}`}
                            >
                              <Play size={10} fill="currentColor" />
                              <span>Start Focus</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const newName = window.prompt('Edit sub-skill name:', sub.name)
                                if (!newName || newName.trim() === sub.name) return
                                try {
                                  if (!isNaN(Number(sub.id))) {
                                    await api.patch('/roadmap-items/' + sub.id, { name: newName.trim() })
                                  }
                                } catch (err) {
                                  console.error('Failed to update sub-skill', err)
                                }
                                setGoals(prev => prev.map(g =>
                                  g.id === activeGoalId
                                    ? { ...g, steps: g.steps.map(s => s.id === activeSkill.id
                                        ? { ...s, subSkills: s.subSkills.map(ss => ss.id === sub.id ? { ...ss, name: newName.trim() } : ss) }
                                        : s
                                      )}
                                    : g
                                ))
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer', padding: 2 }}
                            >
                              <Edit3 size={13} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={async () => {
                                if (!window.confirm(`Delete sub-skill "${sub.name}"?`)) return
                                try {
                                  if (!isNaN(Number(sub.id))) {
                                    await api.delete('/roadmap-items/' + sub.id)
                                  }
                                } catch (err) {
                                  console.error('Failed to delete sub-skill', err)
                                }
                                setGoals(prev => prev.map(g =>
                                  g.id === activeGoalId
                                    ? { ...g, steps: g.steps.map(s => s.id === activeSkill.id
                                        ? { ...s, subSkills: s.subSkills.filter(ss => ss.id !== sub.id) }
                                        : s
                                      )}
                                    : g
                                ))
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 2 }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar and Time Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4e5564' }}>
                            <Clock size={10} />
                            <span>{sub.totalHours}</span>
                            <span>•</span>
                            <span>{sub.investedHours}</span>
                          </div>

                          <div style={{ flex: 1, height: 3.5, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${sub.progress}%`, height: '100%', background: '#00e599' }} />
                          </div>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#ffffff', minWidth: 26, textAlign: 'right' }}>
                            {sub.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR STREAM */}
          <aside className="flow-roadmap-sidebar">
            {/* Skill Details Card */}
            <div className="flow-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Layers size={14} color="#00e599" />
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff' }}>Skill Details</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!activeSkill) return
                    const newName = window.prompt('Edit step name:', activeSkill.name)
                    if (!newName || newName.trim() === activeSkill.name) return
                    try {
                      if (!isNaN(Number(activeSkill.id))) {
                        await api.patch('/roadmap-items/' + activeSkill.id, { name: newName.trim() })
                      }
                    } catch (err) {
                      console.error('Failed to update step', err)
                    }
                    setGoals(prev => prev.map(g =>
                      g.id === activeGoalId
                        ? { ...g, steps: g.steps.map(s => s.id === activeSkill.id ? { ...s, name: newName.trim() } : s) }
                        : g
                    ))
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer', padding: 2 }}
                >
                  <Edit3 size={13} />
                </button>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Title</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>{activeSkill.name}</div>
                </div>

                <div>
                  <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Description</div>
                  <div style={{ fontSize: 11, color: '#8e95a5', lineHeight: 1.4, marginTop: 2 }}>
                    {activeSkill.description}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Total Time</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>
                      <Clock size={11} color="#4e5564" />
                      <span>{activeSkill.totalHours}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Time Invested</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>
                      <Zap size={11} color="#4e5564" />
                      <span>{activeSkill.investedHours}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 9.5, color: '#4e5564', textTransform: 'uppercase', fontWeight: 700 }}>Progress</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${activeSkill.progress}%`, height: '100%', background: '#00e599' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>{activeSkill.progress}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Milestones Card */}
            <div className="flow-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Flag size={14} color="#00e599" />
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff' }}>Related Milestones</span>
                </div>
                <Link to="/milestones" style={{ fontSize: 10.5, color: '#8e95a5' }}>
                  View All →
                </Link>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {activeSkill.relatedMilestones && activeSkill.relatedMilestones.length > 0 ? (
                  activeSkill.relatedMilestones.map((m, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.progress === 100 ? '#00e599' : '#8b5cf6' }} />
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#ffffff' }}>{m.title}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#4e5564', paddingLeft: 12, marginTop: 1 }}>{m.date}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, marginTop: 4 }}>
                        <div style={{ flex: 1, height: 3, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, overflow: 'hidden' }}>
                          <div style={{ width: `${m.progress}%`, height: '100%', background: '#00e599' }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#8e95a5' }}>{m.progress}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e599' }} />
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: '#ffffff' }}>Complete {activeSkill.name}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#4e5564', paddingLeft: 12, marginTop: 1 }}>Target: {activeGoal.targetDate}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 3, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 1.5, overflow: 'hidden' }}>
                        <div style={{ width: `${activeSkill.progress}%`, height: '100%', background: '#00e599' }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#8e95a5' }}>{activeSkill.progress}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'grid', gap: 7 }}>
              <button
                type="button"
                onClick={() => setIsAddSubSkillModalOpen(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} />
                <span>Add Sub Skill</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!activeSkill) return
                  if (window.confirm('Are you sure you want to delete this skill and all its sub-skills?')) {
                    try {
                      if (!isNaN(Number(activeSkill.id))) {
                        await api.delete('/roadmap-items/' + activeSkill.id)
                      }
                    } catch (err) {
                      console.error('Failed to delete step', err)
                    }
                    setGoals(prev => prev.map(g =>
                      g.id === activeGoalId
                        ? { ...g, steps: g.steps.filter(s => s.id !== activeSkill.id) }
                        : g
                    ))
                    setViewMode('roadmap')
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: 'rgba(244, 63, 94, 0.06)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#f43f5e',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
                <span>Delete Skill</span>
              </button>
            </div>
          </aside>
        </div>
        ) : (
          <div style={{ color: '#8e95a5', padding: 20 }}>Select a skill to view details.</div>
        )
      )}

      {/* =========================================================
          MODALS
          ========================================================= */}

      {/* 1. Edit Goal Modal */}
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
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={3}
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Target Date</label>
                <input
                  type="text"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsEditGoalModalOpen(false)}
                style={{ background: 'transparent', color: '#8e95a5', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleSaveGoal}>
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add Step Modal */}
      {isAddStepModalOpen && (
        <div className="flow-modal-backdrop" onClick={() => setIsAddStepModalOpen(false)}>
          <div className="flow-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Add Roadmap Step (Skill)</div>
              <button
                type="button"
                onClick={() => setIsAddStepModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Skill Name</label>
                <input
                  type="text"
                  placeholder="e.g., Computer Vision Foundations"
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="What will be learned in this skill?"
                  value={newStepDesc}
                  onChange={(e) => setNewStepDesc(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Estimated Hours</label>
                <input
                  type="number"
                  value={newStepHours}
                  onChange={(e) => setNewStepHours(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsAddStepModalOpen(false)}
                style={{ background: 'transparent', color: '#8e95a5', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleAddStep}>
                Add Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Sub-Skill Modal */}
      {isAddSubSkillModalOpen && (
        <div className="flow-modal-backdrop" onClick={() => setIsAddSubSkillModalOpen(false)}>
          <div className="flow-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Add Sub-Skill for {activeSkill.name}</div>
              <button
                type="button"
                onClick={() => setIsAddSubSkillModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#8e95a5', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Sub-Skill Name</label>
                <input
                  type="text"
                  placeholder="e.g., Asynchronous Python (asyncio)"
                  value={newSubSkillName}
                  onChange={(e) => setNewSubSkillName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e95a5', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain the concepts covered in this sub-skill"
                  value={newSubSkillDesc}
                  onChange={(e) => setNewSubSkillDesc(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 11, color: '#8e95a5' }}>Target Hours</label>
                  {activeSkill && (
                    <span style={{ fontSize: 10.5, color: '#00e599', fontWeight: 600 }}>
                      Available: {Math.max(0, (parseFloat(activeSkill.totalHours) || 20) - activeSkill.subSkills.reduce((acc, s) => acc + (parseFloat(s.totalHours) || 0), 0))}h remaining (out of {activeSkill.totalHours})
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min={1}
                  value={newSubSkillHours}
                  onChange={(e) => setNewSubSkillHours(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsAddSubSkillModalOpen(false)}
                style={{ background: 'transparent', color: '#8e95a5', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleAddSubSkill}>
                Add Sub-Skill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
