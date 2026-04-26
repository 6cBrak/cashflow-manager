import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import JournalPage from './pages/JournalPage'
import TiersPage from './pages/TiersPage'
import UsersPage from './pages/UsersPage'
import InscriptionsPage from './pages/formations/InscriptionsPage'
import InscriptionDetailPage from './pages/formations/InscriptionDetailPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{ duration: 4000, style: { fontSize: '0.875rem' } }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<JournalPage />} />
            <Route path="tiers" element={<TiersPage />} />
            <Route path="formations" element={<InscriptionsPage />} />
            <Route path="formations/:id" element={<InscriptionDetailPage />} />
            <Route path="admin/users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
