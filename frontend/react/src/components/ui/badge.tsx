import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-accent/20 bg-accent/10 text-accent',
        secondary: 'border-border bg-surface-2 text-text-2',
        success: 'border-success/20 bg-success/10 text-success',
        warning: 'border-warning/20 bg-warning/10 text-warning',
        error: 'border-error/20 bg-error/10 text-error',
        info: 'border-info/20 bg-info/10 text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
