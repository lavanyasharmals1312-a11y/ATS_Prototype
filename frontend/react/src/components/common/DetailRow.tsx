import type { ElementType } from 'react'

interface DetailRowProps {
  label: string
  value: string | null | undefined
  icon: ElementType
  href?: string
}

export function DetailRow({ label, value, icon: Icon, href }: DetailRowProps) {
  const isEmpty = value == null || value === ''

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 shrink-0 rounded bg-surface-2 p-1.5">
        <Icon className="h-4 w-4 text-text-3" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-3">
          {label}
        </p>
        {isEmpty ? (
          <p className="mt-0.5 text-sm italic text-text-4">Not provided</p>
        ) : href ? (
          <a
            href={href}
            className="mt-0.5 block text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {value}
          </a>
        ) : (
          <p className="mt-0.5 text-sm text-text">{value}</p>
        )}
      </div>
    </div>
  )
}
