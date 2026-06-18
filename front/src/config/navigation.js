import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CreditCard,
  HandCoins,
  Package,
  BarChart3,
  UserCog,
  Settings,
  ScrollText,
} from 'lucide-react'

export const NAVIGATION = [
  { to: '/', label: 'Accueil', Icon: LayoutDashboard, roles: ['commercial', 'comptable', 'dg'] },
  { to: '/clients', label: 'Clients', Icon: Users, roles: ['comptable', 'dg'] },
  { to: '/propositions', label: 'Propositions', Icon: FileText, roles: ['commercial', 'comptable', 'dg'] },
  { to: '/factures', label: 'Factures', Icon: Receipt, roles: ['comptable', 'dg'] },
  { to: '/paiements', label: 'Paiements', Icon: CreditCard, roles: ['comptable', 'dg'] },
  { to: '/creances', label: 'Créances', Icon: HandCoins, roles: ['comptable', 'dg'] },
  { to: '/stock', label: 'Stock', Icon: Package, roles: ['comptable', 'dg'] },
  { to: '/rapports', label: 'Rapports', Icon: BarChart3, roles: ['comptable', 'dg'] },
  { to: '/utilisateurs', label: 'Utilisateurs', Icon: UserCog, roles: ['dg'] },
  { to: '/audit', label: "Journal d'audit", Icon: ScrollText, roles: ['dg'] },
  { to: '/parametres', label: 'Paramètres', Icon: Settings, roles: ['dg'] },
]

export function navigationForRole(role) {
  return NAVIGATION.filter((item) => item.roles.includes(role))
}

export function pageTitleForPath(pathname) {
  if (pathname.startsWith('/propositions/nouvelle')) return 'Nouvelle proposition'

  const match = NAVIGATION.find((item) =>
    item.to === '/' ? pathname === '/' : pathname.startsWith(item.to),
  )
  return match?.label ?? 'Saphir Compta'
}
