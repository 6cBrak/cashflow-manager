import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const fmt = v => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' FCFA'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">Jour {label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name} : {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function CaisseChart({ operations }) {
  const data = useMemo(() => {
    const byDay = {}
    operations.forEach(op => {
      const day = parseInt(op.date_operation.split('-')[2], 10)
      if (!byDay[day]) byDay[day] = { jour: day, Entrées: 0, Dépenses: 0 }
      if (op.nature === 'ENTREE') byDay[day].Entrées += Number(op.montant)
      else byDay[day].Dépenses += Number(op.montant)
    })
    return Object.values(byDay).sort((a, b) => a.jour - b.jour)
  }, [operations])

  if (data.length === 0) return null

  return (
    <div className="card mb-4 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Graphique du mois</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="jour"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            label={{ value: 'Jour', position: 'insideBottom', offset: -2, fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          />
          <Tooltip content={(props) => <CustomTooltip {...props} />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Entrées" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Dépenses" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
