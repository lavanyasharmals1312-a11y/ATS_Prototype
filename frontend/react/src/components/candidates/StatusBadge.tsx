import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { className: string; label: string }> = {
  pending: { className: 'border-warning/20 bg-warning/10 text-warning', label: 'Pending' },
  processing: { className: 'border-info/20 bg-info/10 text-info', label: 'Processing' },
  completed: { className: 'border-success/20 bg-success/10 text-success', label: 'Completed' },
  failed: { className: 'border-error/20 bg-error/10 text-error', label: 'Failed' },
  confirmed: { className: 'border-error/20 bg-error/10 text-error', label: 'Confirmed' },
  dismissed: { className: 'border-border bg-surface-2 text-text-2', label: 'Dismissed' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status.toLowerCase()] ?? {
    className: 'border-border bg-surface-2 text-text-2',
    label: status,
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
