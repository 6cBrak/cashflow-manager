import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getInscription, getRecuPdf } from '../../api/formations'
import VersementModal from '../../components/formations/VersementModal'

const fmt = (n) => Number(n).toLocaleString('fr-FR')

const STATUT_COLORS = {
  EN_COURS: 'bg-blue-100 text-blue-800',
  SOLDE: 'bg-green-100 text-green-800',
  ABANDON: 'bg-gray-100 text-gray-600',
}
const TRANCHE_COLORS = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  PAYE: 'bg-green-100 text-green-800',
  EN_RETARD: 'bg-red-100 text-red-700',
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex py-1.5 border-b border-gray-100 last:border-0">
      <span className="w-44 text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

export default function InscriptionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ins, setIns] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showVersement, setShowVersement] = useState(false)
  const [downloadingRecu, setDownloadingRecu] = useState(null)

  const load = useCallback(async () => {
    try {
      const { data } = await getInscription(id)
      setIns(data)
    } catch {
      toast.error('Inscription introuvable.')
      navigate('/formations')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  const downloadRecu = async (versementId) => {
    setDownloadingRecu(versementId)
    try {
      const { data } = await getRecuPdf(id, versementId)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      const v = ins.versements.find(v => v.id === versementId)
      a.download = `recu_${v?.numero_recu || versementId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Erreur téléchargement reçu.')
    } finally {
      setDownloadingRecu(null)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement…</div>
  if (!ins) return null

  const progressPct = ins.montant_total_du > 0
    ? Math.min(100, (ins.total_verse / ins.montant_total_du) * 100)
    : 0

  return (
    <div className="space-y-5 max-w-5xl">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/formations')} className="text-gray-400 hover:text-gray-600 text-sm">← Retour</button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {ins.civilite} {ins.prenom} {ins.nom}
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[ins.statut]}`}>
              {ins.statut === 'EN_COURS' ? 'En cours' : ins.statut === 'SOLDE' ? 'Soldé' : 'Abandon'}
            </span>
          </div>
          <div className="text-sm text-gray-500">{ins.numero} — {ins.formation_nom}</div>
        </div>
        {ins.statut !== 'SOLDE' && (
          <button onClick={() => setShowVersement(true)} className="btn-primary text-sm">
            + Enregistrer un versement
          </button>
        )}
      </div>

      {/* Résumé financier */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Suivi financier</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{fmt(ins.montant_total_du)}</div>
            <div className="text-xs text-gray-500">Total dû (FCFA)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-700">{fmt(ins.total_verse)}</div>
            <div className="text-xs text-gray-500">Versé (FCFA)</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${Number(ins.reste_a_payer) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {fmt(ins.reste_a_payer)}
            </div>
            <div className="text-xs text-gray-500">Reste (FCFA)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-700">
              {ins.bourse_pourcentage > 0 ? `${ins.bourse_pourcentage}%` : '—'}
            </div>
            <div className="text-xs text-gray-500">Bourse accordée</div>
          </div>
        </div>
        {/* Barre de progression */}
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-primary-600 h-2.5 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 text-right mt-1">{Math.round(progressPct)}% payé</div>

        {/* Détail calcul */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
          <span>Prix formation : <strong>{fmt(ins.montant_formation)} FCFA</strong></span>
          <span>Frais inscription : <strong>{fmt(ins.frais_inscription)} FCFA</strong></span>
          <span>Net tranches ({ins.nombre_tranches}×{fmt(ins.montant_par_tranche)}) : <strong>{fmt(ins.montant_net_tranches)} FCFA</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tranches */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Échéancier des tranches</h2>
          {ins.tranches.length === 0 ? (
            <p className="text-xs text-gray-400">Aucune tranche.</p>
          ) : (
            <div className="space-y-2">
              {ins.tranches.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded border border-gray-100 bg-gray-50">
                  <div>
                    <div className="text-sm font-medium">Tranche {t.numero}</div>
                    <div className="text-xs text-gray-500">Échéance : {new Date(t.date_echeance).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-semibold">{fmt(t.montant_attendu)} FCFA</div>
                    {t.reste > 0 && <div className="text-xs text-red-500">Reste : {fmt(t.reste)}</div>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRANCHE_COLORS[t.statut]}`}>
                      {t.statut === 'EN_ATTENTE' ? 'En attente' : t.statut === 'PAYE' ? 'Payé' : 'En retard'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Versements */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Historique des versements</h2>
          {ins.versements.length === 0 ? (
            <p className="text-xs text-gray-400">Aucun versement enregistré.</p>
          ) : (
            <div className="space-y-2">
              {ins.versements.map(v => (
                <div key={v.id} className="flex items-center justify-between p-2.5 rounded border border-gray-100">
                  <div>
                    <div className="text-xs font-mono text-primary-700 font-semibold">{v.numero_recu}</div>
                    <div className="text-xs text-gray-500">{new Date(v.date_versement).toLocaleDateString('fr-FR')} — {v.type_versement_label}</div>
                    {v.notes && <div className="text-xs text-gray-400 italic">{v.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-mono font-bold text-green-700">{fmt(v.montant)} FCFA</div>
                    <button
                      onClick={() => downloadRecu(v.id)}
                      disabled={downloadingRecu === v.id}
                      className="text-xs text-primary-600 hover:text-primary-800 border border-primary-200 rounded px-2 py-0.5"
                    >
                      {downloadingRecu === v.id ? '…' : 'Reçu PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Infos personnelles */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Informations personnelles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <div>
            <InfoRow label="Téléphone" value={ins.telephone} />
            <InfoRow label="Email" value={ins.email} />
            <InfoRow label="Date de naissance" value={ins.date_naissance && new Date(ins.date_naissance).toLocaleDateString('fr-FR')} />
            <InfoRow label="Lieu de naissance" value={ins.lieu_naissance} />
            <InfoRow label="Nationalité" value={ins.nationalite} />
            <InfoRow label="Adresse" value={[ins.ville, ins.quartier, ins.secteur && `Sect. ${ins.secteur}`].filter(Boolean).join(', ')} />
          </div>
          <div>
            <InfoRow label="N° CNIB" value={ins.cnib_numero} />
            <InfoRow label="Niveau d'étude" value={ins.niveau_etude} />
            <InfoRow label="Statut professionnel" value={ins.statut_professionnel} />
            <InfoRow label="Employeur" value={ins.nom_employeur} />
            <InfoRow label="Contact urgence" value={ins.contact_urgence_nom && `${ins.contact_urgence_nom} — ${ins.contact_urgence_tel}`} />
            <InfoRow label="Qui paye" value={ins.qui_paye === 'MOI_MEME' ? 'Lui-même' : `${ins.payeur_nom} (${ins.qui_paye === 'PARRAIN' ? 'Parrain' : 'Entreprise'})`} />
          </div>
        </div>
        {ins.projet_apres_formation && (
          <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
            <span className="font-medium text-xs text-gray-500 block mb-1">Projet après formation :</span>
            {ins.projet_apres_formation}
          </div>
        )}
      </div>

      <VersementModal
        open={showVersement}
        onClose={() => setShowVersement(false)}
        inscription={ins}
        onSaved={load}
      />
    </div>
  )
}
