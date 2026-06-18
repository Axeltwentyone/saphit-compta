const COLOR_STYLES = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
}

export default function StatCard({ icon: Icon, label, value, sublabel, color = 'blue' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-3">
      <div className={`${COLOR_STYLES[color]} rounded-lg p-2.5 text-white shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-800 truncate">{value}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}
