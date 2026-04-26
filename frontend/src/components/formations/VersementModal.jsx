import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../modals/Modal'
import { createVersement } from '../../api/formations'

const today = () => new Date().toISOString().slice(0, 10)
const fmt = (n) => Number(n).toLocaleString('fr-FR')

export default function VersementModal({ open, onClose, inscription, onSaved }) {
  const [form, setForm] = useState({ type_versement: 'TRANCHE', tranche: '', montant: '', date_versement: today(), notes: '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const tranchesNonPayees = (inscription?.tranches || []).filter(t => t.statut !== 'PAYE')

  const handleTypeChange = (e) => {
    set('type_versement', e.target.value)
    set('tranche', '')
    if (e.target.value === 'FRAIS_INSCRIPTION') {
      set('montant', inscription?.frais_inscription || '')
    } else {
      set('montant', '')
    }
  }

  const handleTrancheChange = (e) => {
    set('tranche', e.target.value)
    const t = inscription?.tranches?.find(t => String(t.id) === e.target.value)
    if (t) set('montant', t.reste > 0 ? t.reste : t.montant_attendu)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.montant || Number(form.montant) <= 0) {
      toast.error('Le montant doit être supérieur à 0.')
      return
    }
    const payload = {
      inscription: inscription.id,
      type_versement: form.type_versement,
      tranche: form.type_versement === 'TRANCHE' ? (form.tranche || null) : null,
      montant: Number(form.montant),
      date_versement: form.date_versement,
      notes: form.notes,
    }
    setLoading(true)
    try {
      await createVersement(payload)
      toast.success('Versement enregistré. Reçu disponible dans la fiche.')
      onSaved()
      onClose()
    } catch (err) {
      const detail = err.response?.data
      const msg = typeof detail === 'string' ? detail
        : detail?.detail || Object.values(detail || {})[0]?.[0] || 'Erreur.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!inscription) return null

  return (
    <Modal open={open} onClose={onClose} title="Enregistrer un versement">
      <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
        <div className="font-semibold">{inscription.civilite} {inscription.prenom} {inscription.nom}</div>
        <div className="text-xs text-gray-500">{inscription.numero} — {inscription.formation_nom}</div>
        <div className="flex gap-4 mt-1 text-xs">
          <span>Total dû : <strong>{fmt(inscription.montant_total_du)} FCFA</strong></span>
          <span>Versé : <strong className="text-green-700">{fmt(inscription.total_verse)} FCFA</strong></span>
          <span>Reste : <strong className={Number(inscription.reste_a_payer) > 0 ? 'text-red-600' : 'text-green-600'}>{fmt(inscription.reste_a_payer)} FCFA</strong></span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Type de versement *</label>
          <select className="input" value={form.type_versement} onChange={handleTypeChange}>
            <option value="FRAIS_INSCRIPTION">Frais d'inscription</option>
            <option value="TRANCHE">Tranche</option>
          </select>
        </div>

        {form.type_versement === 'TRANCHE' && (
          <div>
            <label className="label">Tranche concernée</label>
            {tranchesNonPayees.length === 0 ? (
              <p className="text-xs text-green-600 p-2">Toutes les tranches sont payées.</p>
            ) : (
              <select className="input" value={form.tranche} onChange={handleTrancheChange}>
                <option value="">Sélectionner une tranche…</option>
                {tranchesNonPayees.map(t => (
                  <option key={t.id} value={t.id}>
                    Tranche {t.numero} — {fmt(t.montant_attendu)} FCFA (reste : {fmt(t.reste)}) — éch. {new Date(t.date_echeance).toLocaleDateString('fr-FR')}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Montant (FCFA) *</label>
            <input
              type="number" required min="1" step="1"
              className="input text-right font-mono font-semibold"
              value={form.montant}
              onChange={e => set('montant', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Date *</label>
            <input
              type="date" required
              className="input"
              value={form.date_versement}
              onChange={e => set('date_versement', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Notes (optionnel)</label>
          <textarea rows={2} className="input resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Enregistrement…' : 'Enregistrer + Reçu PDF'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
