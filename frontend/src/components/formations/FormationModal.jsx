import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Modal from '../modals/Modal'
import { getFormations, createFormation, updateFormation, deleteFormation } from '../../api/formations'

const fmt = (n) => Number(n).toLocaleString('fr-FR')

const EMPTY = { nom: '', programme: 'INFORMATIQUE', duree: '', prix_base: '', is_active: true }

export default function FormationModal({ open, onClose }) {
  const [formations, setFormations] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    try {
      const { data } = await getFormations()
      setFormations(data.results || data)
    } catch { toast.error('Erreur chargement.') }
  }

  useEffect(() => { if (open) { load(); setForm(EMPTY); setEditing(null) } }, [open])

  const startEdit = (f) => {
    setEditing(f.id)
    setForm({ nom: f.nom, programme: f.programme, duree: f.duree, prix_base: f.prix_base, is_active: f.is_active })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nom.trim() || !form.prix_base) { toast.error('Nom et prix sont requis.'); return }
    setLoading(true)
    try {
      if (editing) {
        await updateFormation(editing, form)
        toast.success('Formation mise à jour.')
      } else {
        await createFormation(form)
        toast.success('Formation créée.')
      }
      setForm(EMPTY); setEditing(null)
      load()
    } catch {
      toast.error('Erreur.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette formation ?')) return
    try {
      await deleteFormation(id)
      toast.success('Formation supprimée.')
      load()
    } catch {
      toast.error('Impossible de supprimer (des inscriptions existent peut-être).')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Gestion du catalogue formations" size="lg">
      <form onSubmit={handleSubmit} className="space-y-3 mb-5 pb-5 border-b">
        <div className="text-xs font-semibold text-gray-600">{editing ? 'Modifier la formation' : 'Ajouter une formation'}</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nom *</label>
            <input className="input" required value={form.nom} onChange={e => set('nom', e.target.value)} />
          </div>
          <div>
            <label className="label">Programme *</label>
            <select className="input" value={form.programme} onChange={e => set('programme', e.target.value)}>
              <option value="INFORMATIQUE">Informatique & Management</option>
              <option value="HUMANITAIRE">Action Humanitaire</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Durée</label>
            <input className="input" placeholder="ex : 3 mois" value={form.duree} onChange={e => set('duree', e.target.value)} />
          </div>
          <div>
            <label className="label">Prix de base (FCFA) *</label>
            <input type="number" className="input text-right font-mono" required value={form.prix_base} onChange={e => set('prix_base', e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="h-4 w-4" />
          <label htmlFor="is_active" className="text-sm text-gray-700">Formation active (visible à l'inscription)</label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary text-sm">
            {loading ? '…' : editing ? 'Modifier' : 'Ajouter'}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(EMPTY) }} className="btn-secondary text-sm">Annuler</button>
          )}
        </div>
      </form>

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {formations.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Aucune formation dans le catalogue.</p>
        ) : (
          formations.map(f => (
            <div key={f.id} className={`flex items-center justify-between p-2.5 rounded border ${f.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div>
                <div className="text-sm font-medium">{f.nom}</div>
                <div className="text-xs text-gray-500">{f.programme === 'INFORMATIQUE' ? 'Informatique' : 'Humanitaire'} — {f.duree || 'durée non définie'}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold">{fmt(f.prix_base)} FCFA</span>
                <button onClick={() => startEdit(f)} className="text-xs text-primary-600 hover:underline">Modifier</button>
                <button onClick={() => handleDelete(f.id)} className="text-xs text-red-500 hover:underline">Suppr.</button>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  )
}
