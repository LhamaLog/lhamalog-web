import { Link } from 'react-router-dom'
import { useAccess } from '../../access/useAccess'

export type TeamTab = 'people' | 'roles' | 'permissions'

const tabs: { id: TeamTab, label: string, href: string, permission: string }[] = [
  { id: 'people', label: 'Pessoas', href: '/equipe', permission: 'MEMBERS_VIEW' },
  { id: 'roles', label: 'Cargos', href: '/equipe/cargos', permission: 'NOTIFICATION_ROLES_MANAGE' },
  { id: 'permissions', label: 'Permissões', href: '/equipe/permissoes', permission: 'MEMBERS_VIEW' },
]

export function teamTabFromPath(pathname: string): TeamTab {
  if (pathname.startsWith('/equipe/cargos')) return 'roles'
  if (pathname.startsWith('/equipe/permissoes')) return 'permissions'
  return 'people'
}

// Tabs of the Team screen (spec 005, W1 and W2). Each tab shows only for who has its permission.
export function TeamTabs({ active }: { active: TeamTab }) {
  const access = useAccess()
  const visible = tabs.filter((tab) => access.can(tab.permission))
  if (visible.length < 2) return null
  return (
    <nav aria-label="Seções da equipe" className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
      {visible.map((tab) => (
        <Link
          key={tab.id}
          to={tab.href}
          aria-current={tab.id === active ? 'page' : undefined}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab.id === active ? 'bg-blue-50 text-[#0C70F2]' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
