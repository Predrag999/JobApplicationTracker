import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import ApplicationList from '@/pages/ApplicationList'
import ApplicationForm from '@/pages/ApplicationForm'
import ApplicationDetail from '@/pages/ApplicationDetail'

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
