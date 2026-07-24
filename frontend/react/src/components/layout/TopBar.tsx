import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/upload': 'Upload Resume',
  '/candidates': 'Candidates',
  '/duplicates': 'Duplicates',
  '/import': 'Import Tracker',
  '/users': 'Team',
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
  const title = getPageTitle(location.pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-surface/80 px-6 backdrop-blur-md">
      <h2 className="text-sm font-medium text-text">{title}</h2>
    </header>
  )
}
