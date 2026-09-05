import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { api } from './api/client'
import type { Department } from './api/types'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Onboarding } from './features/onboarding/Onboarding'
import { AppShell } from './layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { DepartmentDetail } from './pages/DepartmentDetail'
import { DepartmentList } from './pages/DepartmentList'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

import { ExperimentsView } from './pages/ExperimentsView'
import { ResourcesView } from './pages/ResourcesView'

function HomeRoute() {
  const [hasDepartments, setHasDepartments] = useState<boolean | null>(null)

  useEffect(() => {
    api.get<Department[]>('/departments').then((departments) => setHasDepartments(departments.length > 0))
  }, [])

  if (hasDepartments === null) return <div className="card">Loading...</div>
  if (!hasDepartments) return <Onboarding onComplete={() => setHasDepartments(true)} />
  return <Dashboard />
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
            <AppShell>
              <Routes>
                <Route path="/" element={<HomeRoute />} />
                <Route path="/departments" element={<DepartmentList />} />
                <Route path="/departments/:id" element={<DepartmentDetail />} />
                <Route path="/experiments" element={<ExperimentsView />} />
                <Route path="/resources" element={<ResourcesView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
