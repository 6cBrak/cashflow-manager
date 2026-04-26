import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getInscriptions, getStatsInscriptions } from '../../api/formations'
import { useAuth } from '../../context/AuthContext'
import InscriptionModal from '../../components/formations/InscriptionModal'
import FormationModal from '../../components/formations/FormationModal'

const STATUT_LABELS = { EN_COURS: 'En cours', SOLDE: 'Soldé', ABANDON: 'Abandon' }
const STATUT_COLORS = {
  EN_COURS: 'bg-blue-100 text-blue-800',
  SOLDE: 'bg-green-100 text-green-800',
  ABANDON: 'bg-gray-100 text-gray-600',
}

const fmt = (n) => Number(n).toLocaleString('fr-FR')

export default function InscriptionsPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [inscriptions, setInscriptions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtreCentre, setFiltreCentre] = useState('')
  const [showInscription, setShowInscription] = useState(false)
  const [showFormation, setShowFormation] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filtreStatut) params.statut = filtreStatut
      if (filtreCentre) params.centre = filtreCentre
      const [insRes, statsRes] = await Promise.all([
        getInscriptions(params),
        getStatsInscriptions(params),
      ])
      setInscriptions(insRes.data.results || insRes.data)
      setStats(statsRes.data)
    } catch {
      toast.error('Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }, [search, filtreStatut, filtreCentre])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inscriptions — Formations</h1>
          <p className="text-sm text-gray-500">Gestion des inscrits et suivi des paiements</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => setShowFormation(true)} className="btn-secondary text-sm">
              Gérer les formations
            </button>
          )}
          <button onClick={() => setShowInscription(true)} className="btn-primary text-sm">
            + Nouvelle inscription
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total inscrits', value: stats.total_inscrits, color: 'text-gray-900' },
            { label: 'En cours', value: stats.en_cours, color: 'text-blue-700' },
            { label: 'Soldés', value: stats.soldes, color: 'text-green-700' },
            { label: 'Tranches en retard', value: stats.retards, color: 'text-red-600' },
            { label: 'Total encaissé', value: `${fmt(stats.total_encaisse)} FCFA`, color: 'text-primary-700' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-3 text-center shadow-sm">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          className="input w-64 text-sm"
          placeholder="Rechercher nom, téléphone, n°…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-40 text-sm" value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="EN_COURS">En cours</option>
          <option value="SOLDE">Soldé</option>
          <option value="ABANDON">Abandon</option>
        </select>
        <select className="input w-44 text-sm" value={filtreCentre} onChange={e => setFiltreCentre(e.target.value)}>
          <option value="">Tous les centres</option>
          <option value="OUAGA">EPA Ouagadougou</option>
          <option value="BOBO">EPA Bobo</option>
          <option value="SAHEL">EPA Sahel/Dori</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : inscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucune inscription trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">N° / Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Inscrit(e)</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Formation</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Centre</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Total dû</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Versé</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Reste</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inscriptions.map(ins => (
                  <tr
                    key={ins.id}
                    onClick={() => navigate(`/formations/${ins.id}`)}
                    className="hover:bg-primary-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold text-primary-700">{ins.numero}</div>
                      <div className="text-xs text-gray-400">{new Date(ins.date_inscription).toLocaleDateString('fr-FR')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{ins.civilite} {ins.prenom} {ins.nom}</div>
                      <div className="text-xs text-gray-400">{ins.telephone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{ins.formation_nom}</div>
                      {ins.bourse_pourcentage > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                          Bourse {ins.bourse_pourcentage}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{ins.centre}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{fmt(ins.montant_total_du)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-green-700">{fmt(ins.total_verse)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <span className={Number(ins.reste_a_payer) > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                        {fmt(ins.reste_a_payer)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[ins.statut]}`}>
                        {STATUT_LABELS[ins.statut]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InscriptionModal open={showInscription} onClose={() => setShowInscription(false)} onSaved={load} />
      <FormationModal open={showFormation} onClose={() => setShowFormation(false)} />
    </div>
  )
}
