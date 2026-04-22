import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await login(form.email, form.password)
      signIn(data.user, data.access, data.refresh)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || 'Identifiants invalides.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <span className="text-3xl">💰</span>
          </div>
          <h1 className="text-2xl font-bold text-white">CashFlow Manager</h1>
          <p className="text-primary-200 text-sm mt-1">EPA_OUAGA — Gestion de caisse</p>
        </div>

        <div className="card p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Connexion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Adresse email</label>
              <input
                type="email"
                required
                autoFocus
                className="input"
                placeholder="admin@cashflow.local"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, email: form.email, password: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2 mt-2"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
