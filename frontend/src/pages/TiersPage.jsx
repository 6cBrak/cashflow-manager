import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getTiers, createTiers, updateTiers, deleteTiers } from '../api/tiers'
import Modal from '../components/modals/Modal'
import ConfirmModal from '../components/modals/ConfirmModal'

export default function TiersPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, tiers: null })
  const [confirmModal, setConfirmModal] = useState({ open: false, tiers: null })
  const [form, setForm] = useState({ nom: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getTiers(search)
      setList(data.results || data)
    } catch {
      toast.error('Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setForm({ nom: '' })
    setModal({ open: true, tiers: null })
  }

  const openEdit = t => {
    setForm({ nom: t.nom })
    setModal({ open: true, tiers: t })
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.nom.trim()) return
    setSaving(true)
    try {
      if (modal.tiers) {
        await updateTiers(modal.tiers.id, form)
        toast.success('Prestataire modifié.')
      } else {
        await createTiers(form)
        toast.success('Prestataire ajouté.')
      }
      setModal({ open: false, tiers: null })
      load()
    } catch (err) {
      const d = err.response?.data
      toast.error(d?.nom?.[0] || d?.detail || 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTiers(confirmModal.tiers.id)
      toast.success('Prestataire désactivé.')
      load()
    } catch {
      toast.error('Erreur.')
    } finally {
      setConfirmModal({ open: false, tiers: null })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Référentiel Prestataires</h1>
        <button onClick={openCreate} className="btn-primary">+ Ajouter</button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-3 border-b bg-gray-50">
          <input
            type="text"
            className="input max-w-xs"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-800 text-white text-xs uppercase">
              <th className="px-4 py-3 text-left">Nom</th>
              <th className="px-4 py-3 text-center">Statut</th>
              <th className="px-4 py-3 text-center">Créé le</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chargement…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Aucun prestataire.</td></tr>
            ) : (
              list.map(t => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{t.nom}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-gray-500 text-xs">
                    {new Date(t.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(t)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                        Éditer
                      </button>
                      {t.is_active && (
                        <button onClick={() => setConfirmModal({ open: true, tiers: t })} className="text-xs text-red-600 hover:text-red-800 font-medium">
                          Désactiver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modale création/édition */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, tiers: null })}
        title={modal.tiers ? 'Modifier le prestataire' : 'Nouveau prestataire'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nom *</label>
            <input type="text" required autoFocus className="input"
              placeholder="Nom du prestataire ou client"
              value={form.nom}
              onChange={e => setForm({ nom: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal({ open: false, tiers: null })} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement…' : modal.tiers ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, tiers: null })}
        onConfirm={handleDelete}
        title="Désactiver le prestataire"
        message={`Désactiver "${confirmModal.tiers?.nom}" ? Il n'apparaîtra plus dans l'autocomplétion.`}
        danger
      />
    </div>
  )
}
