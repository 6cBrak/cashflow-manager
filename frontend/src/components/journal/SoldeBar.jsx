const fmt = v => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2 })

export default function SoldeBar({ solde }) {
  if (!solde) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div className="card p-3 border-l-4 border-l-gray-400">
        <p className="text-xs text-gray-500 mb-0.5">Solde reporté</p>
        <p className="font-bold text-gray-700">{fmt(solde.solde_reporte)} <span className="text-xs font-normal">FCFA</span></p>
      </div>
      <div className="card p-3 border-l-4 border-l-blue-500">
        <p className="text-xs text-gray-500 mb-0.5">Total encaissé</p>
        <p className="font-bold text-blue-700">{fmt(solde.total_entrees)} <span className="text-xs font-normal">FCFA</span></p>
      </div>
      <div className="card p-3 border-l-4 border-l-red-500">
        <p className="text-xs text-gray-500 mb-0.5">Total décaissé</p>
        <p className="font-bold text-red-700">{fmt(solde.total_depenses)} <span className="text-xs font-normal">FCFA</span></p>
      </div>
      <div className={`card p-3 border-l-4 ${solde.solde_final >= 0 ? 'border-l-green-500' : 'border-l-red-600'}`}>
        <p className="text-xs text-gray-500 mb-0.5">Solde du mois</p>
        <p className={`font-bold ${solde.solde_final >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {fmt(solde.solde_final)} <span className="text-xs font-normal">FCFA</span>
        </p>
      </div>
    </div>
  )
}
