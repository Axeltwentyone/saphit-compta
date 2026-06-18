const STATUT_STYLES = {
  brouillon: 'bg-slate-100 text-slate-700',
  soumise: 'bg-amber-100 text-amber-700',
  convertie: 'bg-emerald-100 text-emerald-700',
  rejetee: 'bg-red-100 text-red-700',
  emise: 'bg-blue-100 text-blue-700',
  partiellement_reglee: 'bg-amber-100 text-amber-700',
  soldee: 'bg-emerald-100 text-emerald-700',
  annulee: 'bg-red-100 text-red-700',
}

const STATUT_LABELS = {
  brouillon: 'Brouillon',
  soumise: 'Soumise',
  convertie: 'Convertie',
  rejetee: 'Rejetée',
  emise: 'Émise',
  partiellement_reglee: 'Partiellement réglée',
  soldee: 'Soldée',
  annulee: 'Annulée',
}

export default function StatutBadge({ statut }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${STATUT_STYLES[statut] ?? 'bg-slate-100 text-slate-700'}`}
    >
      {STATUT_LABELS[statut] ?? statut}
    </span>
  )
}
