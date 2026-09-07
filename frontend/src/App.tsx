import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { api } from './api/client'
import type { Department } from './api/types'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Onboarding } from './features/onboarding/Onboarding'
import { TimerProvider } from './features/timer/TimerContext'
import { AppShell } from './layout/AppShell'
import { CalendarView } from './pages/CalendarView'
import { Dashboard } from './pages/Dashboard'
import { DepartmentDetail } from './pages/DepartmentDetail'
import { DepartmentList } from './pages/DepartmentList'
import { ExperimentsView } from './pages/ExperimentsView'
import { FocusMode } from './pages/FocusMode'
import { GoalsView } from './pages/GoalsView'
import { JournalView } from './pages/JournalView'
import { Login } from './pages/Login'
import { MilestonesView } from './pages/MilestonesView'
import { ReflectionsView } from './pages/ReflectionsView'
import { Register } from './pages/Register'
import { ResourcesView } from './pages/ResourcesView'
import { RoadmapView } from './pages/RoadmapView'
import { SettingsView } from './pages/SettingsView'

function HomeRoute() {
  const [hasDepartments, setHasDepartments] = useState<boolean | null>(null)

  useEffect(() => {
    api
      .get<Department[]>('/departments')
      .then((departments) => setHasDepartments(departments.length > 0))
      .catch(() => setHasDepartments(true))
  }, [])

  if (hasDepartments === null) return <div className="card">Loading Flow...</div>
  if (!hasDepartments) return <Onboarding onComplete={() => setHasDepartments(true)} />
  return <Dashboard />
}

function StandaloneRoadmapRoute() {
  const [depId, setDepId] = useState<number | null>(null)
  useEffect(() => {
    api
      .get<Department[]>('/departments')
      .then((deps) => {
        if (deps.length > 0) setDepId(deps[0].id)
        else setDepId(1)
      })
      .catch(() => setDepId(1))
  }, [])
  if (!depId) return <div className="card">Loading Roadmap...</div>
  return <RoadmapView departmentId={depId} />
}

function StandaloneMilestonesRoute() {
  const [depId, setDepId] = useState<number | null>(null)
  useEffect(() => {
    api
      .get<Department[]>('/departments')
      .then((deps) => {
        if (deps.length > 0) setDepId(deps[0].id)
        else setDepId(1)
      })
      .catch(() => setDepId(1))
  }, [])
  if (!depId) return <div className="card">Loading Milestones...</div>
  return <MilestonesView departmentId={depId} />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <TimerProvider>
              <AppShell>
                <Routes>
                  <Route path="/" element={<HomeRoute />} />
                  <Route path="/focus" element={<FocusMode />} />
                  <Route path="/roadmap" element={<StandaloneRoadmapRoute />} />
                  <Route path="/goals" element={<GoalsView />} />
                  <Route path="/milestones" element={<StandaloneMilestonesRoute />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/journal" element={<JournalView />} />
                  <Route path="/reflections" element={<ReflectionsView />} />
                  <Route path="/settings" element={<SettingsView />} />
                  <Route path="/departments" element={<DepartmentList />} />
                  <Route path="/departments/:id" element={<DepartmentDetail />} />
                  <Route path="/experiments" element={<ExperimentsView />} />
                  <Route path="/resources" element={<ResourcesView />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            </TimerProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
