import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string | undefined
  icon: LucideIcon
  isLoading?: boolean
  isError?: boolean
  /** If true, value > 0 will be colored with the attention color */
  attentionColor?: 'warning' | 'error'
}

export function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
  isError,
  attentionColor,
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : undefined
  const hasAttention =
    attentionColor && numericValue !== undefined && numericValue > 0

  return (
    <div className="rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-surface-2">
      <Icon
        className="h-4 w-4 text-text-3"
        aria-hidden="true"
      />
      <p className="mt-3 text-xs font-medium uppercase tracking-widest text-text-3">
        {label}
      </p>
      {isLoading ? (
        <div className="mt-1 h-9 w-16 animate-pulse rounded bg-surface-2" />
      ) : isError ? (
        <p className="mt-1 text-3xl font-bold text-text-4 tabular-nums">—</p>
      ) : (
        <p
          className={cn(
            'mt-1 text-3xl font-bold tabular-nums',
            hasAttention
              ? attentionColor === 'warning'
                ? 'text-warning'
                : 'text-error'
              : 'text-text',
          )}
        >
          {typeof value === 'number' ? value.toLocaleString() : (value ?? '0')}
        </p>
      )}
    </div>
  )
}
