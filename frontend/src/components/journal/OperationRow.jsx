import { useAuth } from '../../context/AuthContext'
import { getFichierUrl } from '../../api/fichiers'

const fmt = v => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2 })

export default function OperationRow({ op, isCloture, onEdit, onDelete, onAttach }) {
  const { isAdmin, user } = useAuth()
  const isEntree = op.nature === 'ENTREE'
  const canEdit = !isCloture && (isAdmin || op.created_by === user?.id)
  const canDelete = !isCloture && isAdmin

  return (
    <tr className={`text-sm border-b transition-colors ${isEntree ? 'bg-blue-50 hover:bg-blue-100' : 'bg-red-50 hover:bg-red-100'}`}>
      <td className="px-3 py-2 text-center whitespace-nowrap text-gray-600">
        {new Date(op.date_operation + 'T00:00:00').toLocaleDateString('fr-FR')}
      </td>
      <td className="px-3 py-2 text-center">
        <span className={isEntree ? 'badge-entree' : 'badge-depense'}>
          {isEntree ? 'Entrée' : 'Dépense'}
        </span>
      </td>
      <td className="px-3 py-2 max-w-[160px] truncate" title={op.tiers_nom}>{op.tiers_nom}</td>
      <td className="px-3 py-2 text-right font-mono text-blue-800 font-medium">
        {isEntree ? fmt(op.montant) : ''}
      </td>
      <td className="px-3 py-2 text-right font-mono text-red-800 font-medium">
        {!isEntree ? fmt(op.montant) : ''}
      </td>
      <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate" title={op.commentaire}>
        {op.commentaire}
      </td>
      <td className="px-3 py-2 text-center">
        {op.has_piece_jointe ? (
          <a
            href={getFichierUrl(op.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-primary-700"
            title="Voir la pièce jointe"
          >📎</a>
        ) : (
          !isCloture && (
            <button onClick={() => onAttach(op)} className="text-gray-300 hover:text-gray-500 text-lg leading-none" title="Joindre un fichier">+</button>
          )
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1 justify-center">
          {canEdit && (
            <button onClick={() => onEdit(op)} className="text-xs text-primary-600 hover:text-primary-800 font-medium px-1.5 py-0.5 rounded hover:bg-primary-50">
              Éditer
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(op)} className="text-xs text-red-600 hover:text-red-800 font-medium px-1.5 py-0.5 rounded hover:bg-red-50">
              Supp.
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
