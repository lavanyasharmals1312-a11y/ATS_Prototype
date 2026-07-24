import type { LucideIcon, ReactNode } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2">
        <Icon className="h-5 w-5 text-text-3" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-text-3">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
