import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight, ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { navigationForRole } from '../config/navigation'

const ROLE_LABELS = {
  commercial: 'Commercial',
  comptable: 'Comptabilité',
  dg: 'Administrateur (DG)',
}

export default function Sidebar({ collapsed, onToggleCollapsed }) {
  const { user, logout } = useAuth()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const items = navigationForRole(user.role)
  const initiale = user.name?.[0]?.toUpperCase()

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} shrink-0 bg-slate-900 text-slate-300 flex flex-col transition-all duration-150`}
    >
      <div className="h-16 flex items-center justify-between px-3 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            S
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-semibold leading-tight">SAPHIR</p>
              <p className="text-[11px] text-slate-400 leading-tight truncate">
                Gestion Commerciale &amp; Comptable
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapsed}
          className="text-slate-400 hover:text-white p-1 rounded shrink-0"
          aria-label="Réduire/étendre le menu"
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-2 relative">
        {menuOuvert && !collapsed && (
          <button
            onClick={() => {
              setMenuOuvert(false)
              logout()
            }}
            className="absolute bottom-full left-2 right-2 mb-1 flex items-center gap-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg px-3 py-2 text-sm shadow-lg"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        )}

        <button
          onClick={() => (collapsed ? logout() : setMenuOuvert((o) => !o))}
          className="w-full flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-slate-800"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-medium shrink-0">
            {initiale}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 text-left">
                <p className="text-sm text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
              </div>
              <ChevronDown size={16} className="ml-auto shrink-0 text-slate-400" />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
