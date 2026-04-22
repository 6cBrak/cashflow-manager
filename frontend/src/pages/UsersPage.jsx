import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getUsers, createUser, updateUser, deleteUser } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/modals/Modal'
import ConfirmModal from '../components/modals/ConfirmModal'

const EMPTY_FORM = { email: '', full_name: '', role: 'caissier', password: '', is_active: true }

export default function UsersPage() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ open: false, user: null })
  const [confirm, setConfirm] = useState({ open: false, user: null })
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getUsers()
      setUsers(data)
    } catch {
      toast.error('Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  if (!isAdmin) return (
    <div className="text-center py-16 text-gray-400">Accès réservé aux administrateurs.</div>
  )

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ open: true, user: null }) }
  const openEdit = u => {
    setForm({ email: u.email, full_name: u.full_name, role: u.role, password: '', is_active: u.is_active })
    setModal({ open: true, user: u })
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal.user) {
        const payload = { full_name: form.full_name, role: form.role, is_active: form.is_active }
        await updateUser(modal.user.id, payload)
        toast.success('Utilisateur modifié.')
      } else {
        await createUser(form)
        toast.success('Utilisateur créé.')
      }
      setModal({ open: false, user: null })
      load()
    } catch (err) {
      const d = err.response?.data
      toast.error(d?.email?.[0] || d?.detail || Object.values(d || {})[0]?.[0] || 'Erreur.')
    } finally {
      setSaving(false)
    }
  }

  const handleDisable = async () => {
    try {
      await deleteUser(confirm.user.id)
      toast.success('Utilisateur désactivé.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur.')
    } finally {
      setConfirm({ open: false, user: null })
    }
  }

  const roleBadge = role => role === 'admin'
    ? <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 font-medium">Admin</span>
    : <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">Caissier</span>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Gestion des utilisateurs</h1>
        <button onClick={openCreate} className="btn-primary">+ Créer un compte</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-800 text-white text-xs uppercase">
              <th className="px-4 py-3 text-left">Nom</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-center">Rôle</th>
              <th className="px-4 py-3 text-center">Statut</th>
              <th className="px-4 py-3 text-center">Dernière connexion</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chargement…</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-800">{u.full_name}</td>
                <td className="px-4 py-2 text-gray-600">{u.email}</td>
                <td className="px-4 py-2 text-center">{roleBadge(u.role)}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.is_active ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                <td className="px-4 py-2 text-center text-xs text-gray-500">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(u)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">Éditer</button>
                    {u.is_active && (
                      <button onClick={() => setConfirm({ open: true, user: u })} className="text-xs text-red-600 hover:text-red-800 font-medium">Désactiver</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, user: null })}
        title={modal.user ? 'Modifier l\'utilisateur' : 'Créer un compte'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nom complet *</label>
            <input type="text" required className="input" value={form.full_name}
              onChange={e => set('full_name', e.target.value)} />
          </div>
          {!modal.user && (
            <div>
              <label className="label">Email *</label>
              <input type="email" required className="input" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">Rôle *</label>
            <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="caissier">Caissier</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          {!modal.user && (
            <div>
              <label className="label">Mot de passe *</label>
              <input type="password" required minLength={8} className="input" value={form.password}
                onChange={e => set('password', e.target.value)} />
            </div>
          )}
          {modal.user && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active}
                onChange={e => set('is_active', e.target.checked)} />
              <label htmlFor="is_active" className="text-sm text-gray-700">Compte actif</label>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal({ open: false, user: null })} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement…' : modal.user ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirm.open}
        onClose={() => setConfirm({ open: false, user: null })}
        onConfirm={handleDisable}
        title="Désactiver l'utilisateur"
        message={`Désactiver le compte de "${confirm.user?.full_name}" ? Il ne pourra plus se connecter.`}
        danger
      />
    </div>
  )
}
