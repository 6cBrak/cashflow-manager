import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from './Navbar'

export default function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto mb-2"></div>
          <p className="text-sm">Chargement…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
