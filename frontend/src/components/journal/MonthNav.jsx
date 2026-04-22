const MOIS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export default function MonthNav({ mois, annee, onPrev, onNext, isCloture }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onPrev} className="btn-ghost p-1.5" title="Mois précédent">
        ◀
      </button>
      <div className="text-center min-w-[180px]">
        <p className="font-bold text-gray-800 text-base leading-tight">
          {MOIS[mois]} {annee}
        </p>
        {isCloture && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
            Mois clôturé
          </span>
        )}
      </div>
      <button onClick={onNext} className="btn-ghost p-1.5" title="Mois suivant">
        ▶
      </button>
    </div>
  )
}
