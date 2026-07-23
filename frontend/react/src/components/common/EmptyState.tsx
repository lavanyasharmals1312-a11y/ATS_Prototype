import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-surface-2 p-4">
        <Icon className="h-8 w-8 text-text-3" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-text-3">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
