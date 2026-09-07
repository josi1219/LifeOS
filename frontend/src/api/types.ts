export interface User {
  id: number
  email: string
  created_at: string
}

export interface Department {
  id: number
  name: string
  description: string | null
  purpose: string | null
  long_term_goal: string | null
  priority: number
  status: string
  current_phase: string | null
  secondary_purpose: string | null
  created_at: string
  updated_at: string
}

export interface Goal {
  id: number
  department_id: number
  department_name?: string | null
  name: string
  description: string | null
  why: string | null
  success_definition: string | null
  priority: number
  target_date: string | null
  status: string
  progress?: number
  milestones_count?: number
  completed_milestones_count?: number
  created_at: string
  updated_at: string
}

export interface Roadmap {
  id: number
  department_id: number
  goal_id: number | null
  name: string
  created_at: string
  updated_at: string
}

export interface RoadmapItem {
  id: number
  roadmap_id: number
  parent_id: number | null
  name: string
  description: string | null
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | string
  progress: number
  estimated_hours: number | null
  sort_order: number
  prerequisite_ids: number[]
  created_at: string
  updated_at: string
}

export interface RoadmapItemTree extends RoadmapItem {
  children: RoadmapItemTree[]
}

export interface GoalRoadmapDetail {
  roadmap: Roadmap
  items: RoadmapItemTree[]
  total_steps: number
  completed_steps: number
  progress: number
}

export interface CalendarEventItem {
  id: string
  title: string
  type: string
  date: string
  time: string
  duration: string
  dot_color: string
}

export interface UpcomingMilestoneSummary {
  id: number
  title: string
  date: string
  progress: number
  dot_color: string
}

export interface CalendarMonthResponse {
  year: number
  month: number
  events: CalendarEventItem[]
  upcoming_milestones: UpcomingMilestoneSummary[]
}

export interface Skill {
  id: number
  department_id: number
  name: string
  purpose: string | null
  prerequisite_text: string | null
  status: string
  progress: number
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: number
  department_id: number
  goal_id: number | null
  name: string
  description: string | null
  completion_criteria: string | null
  status: string
  progress: number
  completion_date: string | null
  skill_ids?: number[]
  skill_names?: string[]
  skills_completed_count?: number
  skills_total_count?: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  department_id: number
  goal_id: number | null
  name: string
  purpose: string | null
  status: string
  progress: number
  start_date: string | null
  end_date: string | null
  repo_url: string | null
  deployment_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  project_id: number
  name: string
  status: string
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface Resource {
  id: number
  user_id: number
  type: 'url' | 'video' | 'article' | 'book' | 'document' | 'course' | 'note' | string
  title: string
  url_or_path: string | null
  department_id: number | null
  goal_id: number | null
  skill_id: number | null
  roadmap_item_id: number | null
  project_id: number | null
  created_at: string
  updated_at: string
}

export interface Experiment {
  id: number
  user_id: number
  department_id: number | null
  name: string
  description: string | null
  purpose: string | null
  time_budget_hours: number | null
  status: 'exploring' | 'continue' | 'pause' | 'reject' | 'promote' | string
  result: string | null
  created_at: string
  completed_at: string | null
}

export interface ChangeRecord {
  id: number
  field_name: string
  previous_value: string | null
  new_value: string | null
  reason: string | null
  changed_at: string
}

export interface FocusState {
  department: Department | null
  goal: Goal | null
  note: string | null
  is_manual_override: boolean
  milestone: Milestone | null
  next_action_roadmap_item: RoadmapItem | null
}

export interface ActiveDepartmentSummary {
  id: number
  name: string
  priority: number
  status: string
  current_phase: string | null
}

export interface RecentActivityItem {
  entity_type: 'department' | 'goal'
  entity_id: number
  entity_name: string
  field_name: string
  previous_value: string | null
  new_value: string | null
  changed_at: string
}

export interface DashboardOverview {
  focus: FocusState
  active_departments: ActiveDepartmentSummary[]
  recent_activity: RecentActivityItem[]
}

export interface TimeSession {
  id: number
  user_id: number
  department_id: number | null
  goal_id: number | null
  roadmap_item_id: number | null
  skill_id: number | null
  project_id: number | null
  task_id: number | null
  start_time: string
  end_time: string | null
  last_paused_at: string | null
  duration_seconds: number
  pause_duration_seconds: number
  status: 'running' | 'paused' | 'completed' | 'discarded' | string
  note: string | null
  created_at: string
  department_name: string | null
  goal_name: string | null
  roadmap_item_name: string | null
  skill_name: string | null
  project_name: string | null
  task_name: string | null
}

export interface TimeSessionStartRequest {
  department_id?: number | null
  goal_id?: number | null
  roadmap_item_id?: number | null
  skill_id?: number | null
  project_id?: number | null
  task_id?: number | null
  note?: string | null
}

export interface TimeSessionStopRequest {
  note?: string | null
  update_focus_note?: boolean
}

export interface TimeSessionManualCreate {
  start_time: string
  end_time: string
  department_id?: number | null
  goal_id?: number | null
  roadmap_item_id?: number | null
  skill_id?: number | null
  project_id?: number | null
  task_id?: number | null
  note?: string | null
}

export interface DepartmentTimeSummary {
  department_id: number
  department_name: string
  duration_seconds: number
}

export interface TimeSummaryResponse {
  today_seconds: number
  week_seconds: number
  total_seconds: number
  by_department: DepartmentTimeSummary[]
}
