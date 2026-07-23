import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/upload': 'Upload Resume',
  '/candidates': 'Candidates',
  '/duplicates': 'Duplicates',
  '/import': 'Import Tracker',
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/candidates/') && pathname.endsWith('/edit')) {
    return 'Edit Candidate'
  }
  if (pathname.startsWith('/candidates/')) {
    return 'Candidate Profile'
  }
  return pageTitles[pathname] ?? 'ProEx ATS'
}

export function TopBar() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const title = getPageTitle(location.pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-surface/80 px-6 backdrop-blur">
      <h2 className="text-sm font-medium text-text-2">{title}</h2>
      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-text-3 sm:inline">{user?.role}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
          {user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
      </div>
    </header>
  )
}
