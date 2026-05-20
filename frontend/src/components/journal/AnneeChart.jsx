import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getStatsAnnee } from '../../api/operations'

const fmt = v => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' FCFA'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name} : {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function AnneeChart() {
  const anneeActuelle = new Date().getFullYear()
  const [annee, setAnnee] = useState(anneeActuelle)
  const [data, setData] = useState([])
  const [anneesDisponibles, setAnneesDisponibles] = useState([anneeActuelle])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getStatsAnnee(annee)
      .then(res => {
        setData(res.data.mois)
        setAnneesDisponibles(res.data.annees_disponibles)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [annee])

  const totalEntrees = data.reduce((s, m) => s + m.entrees, 0)
  const totalDepenses = data.reduce((s, m) => s + m.depenses, 0)

  return (
    <div className="card mb-4 p-4">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Bilan annuel — <span className="text-primary-700">{annee}</span>
        </h2>
        <div className="flex items-center gap-2">
          {/* Résumé rapide */}
          <span className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-1 rounded">
            Entrées : {fmt(totalEntrees)}
          </span>
          <span className="text-xs text-red-700 font-mono bg-red-50 px-2 py-1 rounded">
            Dépenses : {fmt(totalDepenses)}
          </span>
          {/* Sélecteur d'année */}
          <select
            value={annee}
            onChange={e => setAnnee(Number(e.target.value))}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {anneesDisponibles.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Graphique */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mr-2" />
          Chargement…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip content={(props) => <CustomTooltip {...props} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="entrees" name="Entrées" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="depenses" name="Dépenses" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
