import { useNavigate, Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { logout } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh')
      if (refresh) await logout(refresh)
    } catch { /* ignore */ }
    signOut()
    navigate('/login')
    toast.success('Déconnecté.')
  }

  const navLink = (to, label) => {
    const active = location.pathname === to
    return (
      <Link
        to={to}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          active
            ? 'bg-white/20 text-white'
            : 'text-primary-100 hover:bg-white/10 hover:text-white'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="bg-primary-800 border-b border-primary-900 px-4 py-2 flex items-center gap-4 sticky top-0 z-40">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-4">
        <span className="text-xl">💰</span>
        <span className="font-bold text-white text-sm hidden sm:block">CashFlow</span>
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-1">
        {navLink('/', 'Journal')}
        {navLink('/tiers', 'Prestataires')}
        {isAdmin && navLink('/admin/users', 'Utilisateurs')}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User info + logout */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-white text-xs font-medium leading-none">{user?.full_name}</p>
          <p className="text-primary-300 text-xs capitalize">{user?.role}</p>
        </div>
        <button onClick={handleLogout} className="btn text-primary-200 hover:text-white hover:bg-white/10 text-xs px-2">
          Déconnexion
        </button>
      </div>
    </nav>
  )
}
