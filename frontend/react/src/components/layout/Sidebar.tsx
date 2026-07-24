import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Upload,
  Users,
  Copy,
  FileSpreadsheet,
  LogOut,
  UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'

const workspaceNavItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Candidates', href: '/candidates', icon: Users },
  { label: 'Duplicates', href: '/duplicates', icon: Copy },
  { label: 'Upload', href: '/upload', icon: Upload },
  { label: 'Import', href: '/import', icon: FileSpreadsheet },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
    isActive
      ? 'bg-accent/10 text-accent'
      : 'text-text-3 hover:bg-surface-2 hover:text-text',
  )

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()
  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border/40 bg-[#0D0D12]"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <span className="text-sm font-bold tracking-tight text-text">
          ProEx<span className="font-normal text-text-3"> ATS</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-text-4">
          Workspace
        </p>
        <ul className="space-y-0.5" role="list">
          {workspaceNavItems.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <NavLink to={href} end={href === '/'} className={navLinkClass}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {user?.role === 'admin' && (
          <>
            <p className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-widest text-text-4">
              Team
            </p>
            <ul className="space-y-0.5" role="list">
              <li>
                <NavLink to="/users" className={navLinkClass}>
                  <UserCog className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Team
                </NavLink>
              </li>
            </ul>
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="border-t border-border/40 p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-text">{user?.full_name}</p>
            <p className="truncate text-[10px] text-text-3">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          disabled={isPending}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-text-3 transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
