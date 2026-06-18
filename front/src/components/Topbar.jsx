import { useLocation } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { pageTitleForPath } from '../config/navigation'

const ROLE_LABELS = {
  commercial: 'Commercial',
  comptable: 'Comptabilité',
  dg: 'Administrateur (DG)',
}

const today = new Date().toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function Topbar({ onToggleCollapsed }) {
  const { user } = useAuth()
  const { pathname } = useLocation()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleCollapsed}
          className="text-slate-500 hover:text-slate-800 p-1 rounded"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-800 truncate">
          {pageTitleForPath(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm text-slate-500 hidden sm:inline">
          Aujourd&rsquo;hui : {today}
        </span>
        <button className="text-slate-500 hover:text-slate-800" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-tight">{user.name}</p>
            <p className="text-xs text-slate-500 leading-tight">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
