import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { createOperation, updateOperation } from '../../api/operations'
import { getTiers } from '../../api/tiers'
import { useDebounce } from '../../hooks/useDebounce'

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY = {
  date_operation: today(),
  nature: 'ENTREE',
  tiers: '',
  tiers_libre: '',
  montant: '',
  commentaire: '',
}

export default function OperationModal({ open, onClose, operation, onSaved }) {
  const editing = !!operation
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [tiersList, setTiersList] = useState([])
  const [tiersQuery, setTiersQuery] = useState('')
  const debouncedQ = useDebounce(tiersQuery, 250)

  useEffect(() => {
    if (open) {
      if (operation) {
        setForm({
          date_operation: operation.date_operation,
          nature: operation.nature,
          tiers: operation.tiers || '',
          tiers_libre: operation.tiers_libre || '',
          montant: operation.montant,
          commentaire: operation.commentaire || '',
        })
        setTiersQuery(operation.tiers_nom || '')
      } else {
        setForm(EMPTY)
        setTiersQuery('')
      }
    }
  }, [open, operation])

  const fetchTiers = useCallback(async () => {
    try {
      const { data } = await getTiers(debouncedQ)
      setTiersList(data.results || data)
    } catch { /* ignore */ }
  }, [debouncedQ])

  useEffect(() => { if (open) fetchTiers() }, [fetchTiers, open])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.montant || Number(form.montant) <= 0) {
      toast.error('Le montant doit être supérieur à 0.')
      return
    }
    const payload = {
      date_operation: form.date_operation,
      nature: form.nature,
      tiers: form.tiers || null,
      tiers_libre: form.tiers ? '' : (form.tiers_libre || tiersQuery),
      montant: form.montant,
      commentaire: form.commentaire,
    }
    setLoading(true)
    try {
      if (editing) {
        await updateOperation(operation.id, payload)
        toast.success('Opération modifiée.')
      } else {
        await createOperation(payload)
        toast.success('Opération enregistrée.')
      }
      onSaved()
      onClose()
    } catch (err) {
      const detail = err.response?.data
      const msg = typeof detail === 'string' ? detail
        : detail?.detail || detail?.non_field_errors?.[0]
        || Object.values(detail || {})[0]?.[0]
        || 'Une erreur est survenue.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const selectTiers = t => {
    set('tiers', t.id)
    set('tiers_libre', '')
    setTiersQuery(t.nom)
    setTiersList([])
  }

  const clearTiers = () => {
    set('tiers', '')
    set('tiers_libre', '')
    setTiersQuery('')
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Modifier l\'opération' : 'Nouvelle opération'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date + Nature */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date *</label>
            <input type="date" required className="input"
              value={form.date_operation}
              onChange={e => set('date_operation', e.target.value)} />
          </div>
          <div>
            <label className="label">Nature *</label>
            <select className="input" value={form.nature} onChange={e => set('nature', e.target.value)}>
              <option value="ENTREE">Entrée</option>
              <option value="DEPENSE">Dépense</option>
            </select>
          </div>
        </div>

        {/* Tiers avec autocomplétion */}
        <div className="relative">
          <label className="label">Prestataire / Client</label>
          <input
            type="text"
            className="input"
            placeholder="Rechercher ou saisir librement…"
            value={tiersQuery}
            onChange={e => {
              setTiersQuery(e.target.value)
              set('tiers', '')
            }}
          />
          {form.tiers && (
            <button type="button" onClick={clearTiers}
              className="absolute right-2 top-7 text-gray-400 hover:text-gray-600">×</button>
          )}
          {tiersList.length > 0 && !form.tiers && tiersQuery && (
            <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded-b shadow-lg max-h-40 overflow-y-auto">
              {tiersList.map(t => (
                <li key={t.id}>
                  <button type="button" onClick={() => selectTiers(t)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 hover:text-primary-700">
                    {t.nom}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Montant */}
        <div>
          <label className="label">Montant (FCFA) *</label>
          <input type="number" required min="1" step="1" className="input text-right font-mono"
            placeholder="0"
            value={form.montant}
            onChange={e => set('montant', e.target.value)} />
        </div>

        {/* Commentaire */}
        <div>
          <label className="label">Commentaire</label>
          <textarea rows={2} className="input resize-none"
            placeholder="Motif, référence…"
            value={form.commentaire}
            onChange={e => set('commentaire', e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Enregistrement…' : editing ? 'Modifier' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
