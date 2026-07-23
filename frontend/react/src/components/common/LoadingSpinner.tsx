import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  text?: string
  fullScreen?: boolean
  className?: string
}

export function LoadingSpinner({ text, fullScreen = false, className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen && 'min-h-screen bg-bg',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="h-6 w-6 rounded-full border-2 border-border border-t-accent animate-spin" />
      {text && <p className="text-sm text-text-3">{text}</p>}
      <span className="sr-only">{text ?? 'Loading'}</span>
    </div>
  )
}
