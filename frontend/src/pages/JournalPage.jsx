import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getOperations, getSolde, deleteOperation, cloturerMois } from '../api/operations'
import { exportExcel, exportPdf } from '../api/exports'
import { useAuth } from '../context/AuthContext'
import MonthNav from '../components/journal/MonthNav'
import SoldeBar from '../components/journal/SoldeBar'
import OperationRow from '../components/journal/OperationRow'
import OperationModal from '../components/modals/OperationModal'
import AttachModal from '../components/modals/AttachModal'
import ConfirmModal from '../components/modals/ConfirmModal'

const MOIS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function currentMoisAnnee() {
  const d = new Date()
  return { mois: d.getMonth() + 1, annee: d.getFullYear() }
}

const fmt = v => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2 })

export default function JournalPage() {
  const { mois: m0, annee: a0 } = currentMoisAnnee()
  const [mois, setMois] = useState(m0)
  const [annee, setAnnee] = useState(a0)
  const [operations, setOperations] = useState([])
  const [solde, setSolde] = useState(null)
  const [loading, setLoading] = useState(false)
  const [opModal, setOpModal] = useState({ open: false, op: null })
  const [attachModal, setAttachModal] = useState({ open: false, op: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, op: null })
  const [clotureModal, setClotureModal] = useState(false)
  const { isAdmin } = useAuth()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [opsRes, soldeRes] = await Promise.all([
        getOperations(mois, annee),
        getSolde(mois, annee),
      ])
      setOperations(opsRes.data.results || opsRes.data)
      setSolde(soldeRes.data)
    } catch {
      toast.error('Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }, [mois, annee])

  useEffect(() => { load() }, [load])

  const prevMonth = () => {
    if (mois === 1) { setMois(12); setAnnee(a => a - 1) }
    else setMois(m => m - 1)
  }
  const nextMonth = () => {
    if (mois === 12) { setMois(1); setAnnee(a => a + 1) }
    else setMois(m => m + 1)
  }

  const handleDelete = async () => {
    try {
      await deleteOperation(deleteModal.op.id)
      toast.success('Opération supprimée.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur de suppression.')
    } finally {
      setDeleteModal({ open: false, op: null })
    }
  }

  const handleCloture = async () => {
    try {
      await cloturerMois(mois, annee)
      toast.success(`Mois ${MOIS[mois]} ${annee} clôturé.`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur de clôture.')
    } finally {
      setClotureModal(false)
    }
  }

  const totalEntrees = operations.filter(o => o.nature === 'ENTREE').reduce((s, o) => s + Number(o.montant), 0)
  const totalDepenses = operations.filter(o => o.nature === 'DEPENSE').reduce((s, o) => s + Number(o.montant), 0)

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">
            Journal de caisse — <span className="text-primary-700">{MOIS[mois]} {annee}</span>
          </h1>
          <p className="text-xs text-gray-500">EPA_OUAGA</p>
        </div>
        <MonthNav mois={mois} annee={annee} onPrev={prevMonth} onNext={nextMonth} isCloture={solde?.is_cloture} />
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => exportExcel(mois, annee)} className="btn-secondary text-xs gap-1">
            📥 Excel
          </button>
          <button onClick={() => exportPdf(mois, annee)} className="btn-secondary text-xs gap-1">
            📄 PDF
          </button>
          {isAdmin && !solde?.is_cloture && (
            <button onClick={() => setClotureModal(true)} className="btn text-xs bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100">
              🔒 Clôturer
            </button>
          )}
          {!solde?.is_cloture && (
            <button onClick={() => setOpModal({ open: true, op: null })} className="btn-primary text-sm">
              + Nouvelle opération
            </button>
          )}
        </div>
      </div>

      {/* Bandeau soldes */}
      <SoldeBar solde={solde} />

      {/* Tableau */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-800 text-white text-xs uppercase tracking-wide">
                <th className="px-3 py-3 text-center w-24">Date</th>
                <th className="px-3 py-3 text-center w-24">Nature</th>
                <th className="px-3 py-3 text-left">Prestataire / Client</th>
                <th className="px-3 py-3 text-right w-32">Encaissé (FCFA)</th>
                <th className="px-3 py-3 text-right w-32">Décaissé (FCFA)</th>
                <th className="px-3 py-3 text-left">Commentaire</th>
                <th className="px-3 py-3 text-center w-10">PJ</th>
                <th className="px-3 py-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2" />
                    Chargement…
                  </td>
                </tr>
              ) : operations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    Aucune opération ce mois.
                    {!solde?.is_cloture && (
                      <button
                        onClick={() => setOpModal({ open: true, op: null })}
                        className="block mx-auto mt-2 btn-primary text-sm"
                      >
                        + Ajouter la première opération
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                operations.map(op => (
                  <OperationRow
                    key={op.id}
                    op={op}
                    isCloture={solde?.is_cloture}
                    onEdit={o => setOpModal({ open: true, op: o })}
                    onDelete={o => setDeleteModal({ open: true, op: o })}
                    onAttach={o => setAttachModal({ open: true, op: o })}
                  />
                ))
              )}
            </tbody>
            {operations.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                  <td colSpan={3} className="px-3 py-2 text-right text-xs uppercase text-gray-600">Totaux</td>
                  <td className="px-3 py-2 text-right font-mono text-blue-800">{fmt(totalEntrees)}</td>
                  <td className="px-3 py-2 text-right font-mono text-red-800">{fmt(totalDepenses)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modales */}
      <OperationModal
        open={opModal.open}
        onClose={() => setOpModal({ open: false, op: null })}
        operation={opModal.op}
        onSaved={load}
      />
      <AttachModal
        open={attachModal.open}
        onClose={() => setAttachModal({ open: false, op: null })}
        operation={attachModal.op}
        onSaved={load}
      />
      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, op: null })}
        onConfirm={handleDelete}
        title="Supprimer l'opération"
        message="Cette opération sera supprimée de façon logique (traçabilité conservée). Confirmer ?"
        danger
      />
      <ConfirmModal
        open={clotureModal}
        onClose={() => setClotureModal(false)}
        onConfirm={handleCloture}
        title={`Clôturer ${MOIS[mois]} ${annee}`}
        message={`Le mois ${MOIS[mois]} ${annee} sera clôturé définitivement. Aucune modification ne sera possible. Le solde sera reporté au mois suivant.`}
        danger={false}
      />
    </div>
  )
}
