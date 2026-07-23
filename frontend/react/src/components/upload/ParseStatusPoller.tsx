import { AlertCircle, CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react'
import { useParseJob } from '@/hooks/useParseJob'
import { StatusBadge } from '@/components/candidates/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import type { ParseJobStatus } from '@/types'

interface ParseStatusPollerProps {
  parseJobId: string | null
  onRetry?: () => void
  onComplete?: (candidateId: string | null) => void
}

const STATUS_ICONS: Record<ParseJobStatus, typeof Clock> = {
  pending: Clock,
  processing: RefreshCw,
  completed: CheckCircle2,
  failed: XCircle,
}

export function ParseStatusPoller({ parseJobId, onRetry, onComplete }: ParseStatusPollerProps) {
  const { data: job, isLoading, isError } = useParseJob(parseJobId)

  if (!parseJobId) return null

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 mt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48 mt-1" />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 mt-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-error/10 p-1.5">
            <XCircle className="h-5 w-5 text-error" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-error">Failed to load parse status</p>
            <p className="text-xs text-text-3 mt-0.5">Could not retrieve parse job details</p>
          </div>
        </div>
      </div>
    )
  }

  if (!job) return null

  const Icon = STATUS_ICONS[job.status] ?? Clock
  const isTerminal = job.status === 'completed' || job.status === 'failed'

  if (isTerminal && onComplete) {
    onComplete(job.candidate_id)
  }

  return (
    <div
      className="rounded-lg border border-border bg-surface p-5 mt-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div
          className={`rounded-full p-1.5 mt-0.5 ${
            job.status === 'completed'
              ? 'bg-success/10'
              : job.status === 'failed'
                ? 'bg-error/10'
                : job.status === 'processing'
                  ? 'bg-info/10'
                  : 'bg-surface-3'
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              job.status === 'completed'
                ? 'text-success'
                : job.status === 'failed'
                  ? 'text-error'
                  : job.status === 'processing'
                    ? 'text-info'
                    : 'text-text-3'
            } ${job.status === 'processing' ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text">
              {job.status === 'completed'
                ? 'Resume parsed successfully'
                : job.status === 'failed'
                  ? 'Parse failed'
                  : job.status === 'processing'
                    ? 'Parsing resume...'
                    : 'Parse queued'}
            </p>
            <StatusBadge status={job.status} />
          </div>

          {job.status === 'processing' && (
            <p className="text-xs text-text-3 mt-1">Extracting candidate data from the uploaded file</p>
          )}

          {job.status === 'pending' && (
            <p className="text-xs text-text-3 mt-1">Waiting for parser to become available</p>
          )}

          {job.status === 'failed' && job.error_message && (
            <p className="text-xs text-error mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
              {job.error_message}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs text-text-4">
            {job.started_at && <span>Started: {formatDate(job.started_at)}</span>}
            {job.completed_at && <span>Completed: {formatDate(job.completed_at)}</span>}
          </div>

          {job.status === 'failed' && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Retry parse
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
