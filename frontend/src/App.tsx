import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import ApplicationList from '@/pages/ApplicationList'
import ApplicationForm from '@/pages/ApplicationForm'
import ApplicationDetail from '@/pages/ApplicationDetail'
import LoginPage from '@/pages/LoginPage'
import { Briefcase } from 'lucide-react'

function AppRoutes() {
  const { t } = useTranslation()
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Briefcase className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-sm">{t('appList.loading')}</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="applications" element={<ApplicationList />} />
        <Route path="applications/new" element={<ApplicationForm />} />
        <Route path="applications/:id/edit" element={<ApplicationForm />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
