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
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Upload', href: '/upload', icon: Upload },
  { label: 'Candidates', href: '/candidates', icon: Users },
  { label: 'Duplicates', href: '/duplicates', icon: Copy },
  { label: 'Import', href: '/import', icon: FileSpreadsheet },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border/50 bg-[#0D0D12]"
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-accent/20">
            <span className="text-xs font-bold text-accent">PX</span>
          </div>
          <span className="text-sm font-semibold text-text tracking-tight">ProEx ATS</span>
        </div>
      </div>

      <Separator className="bg-border/50" />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            end={href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-2 hover:bg-surface-2 hover:text-text',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-2 hover:bg-surface-2 hover:text-text',
              )
            }
          >
            <UserCog className="h-4 w-4 shrink-0" aria-hidden="true" />
            Team
          </NavLink>
        )}
      </nav>

      <div className="mt-auto border-t border-border/50 p-4">
        <div className="mb-3 truncate">
          <p className="truncate text-sm font-medium text-text">{user?.full_name}</p>
          <p className="truncate text-xs text-text-3">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-text-2"
          onClick={() => logout()}
          disabled={isPending}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {isPending ? 'Signing out...' : 'Sign out'}
        </Button>
      </div>
    </aside>
  )
}
