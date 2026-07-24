import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  className?: string
  children?: ReactNode
}

export function SectionHeader({ title, className, children }: SectionHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-center justify-between border-b border-border pb-2', className)}>
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {children}
    </div>
  )
}
