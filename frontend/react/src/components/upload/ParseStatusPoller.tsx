import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle, RefreshCw, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useParseJob } from '@/hooks/useParseJob'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ParseJobStatus } from '@/types'

interface ParseStatusPollerProps {
  parseJobId: string | null
  onRetry?: () => void
  onComplete?: (candidateId: string | null) => void
}

const STEPS: { key: ParseJobStatus | 'uploading'; label: string }[] = [
  { key: 'uploading', label: 'Uploading' },
  { key: 'pending', label: 'Queued' },
  { key: 'processing', label: 'Parsing' },
  { key: 'completed', label: 'Done' },
]

const STEP_ORDER: (ParseJobStatus | 'uploading')[] = [
  'uploading',
  'pending',
  'processing',
  'completed',
]

function getStepIndex(status: ParseJobStatus | 'uploading'): number {
  return STEP_ORDER.indexOf(status)
}

export function ParseStatusPoller({ parseJobId, onRetry, onComplete }: ParseStatusPollerProps) {
  const navigate = useNavigate()
  const { data: job, isLoading, isError } = useParseJob(parseJobId)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)

  // Elapsed timer while processing
  useEffect(() => {
    if (job?.status === 'processing') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [job?.status])

  // Notify parent when done (once)
  useEffect(() => {
    const isTerminal = job?.status === 'completed' || job?.status === 'failed'
    if (isTerminal && onComplete && !completedRef.current) {
      completedRef.current = true
      onComplete(job.candidate_id ?? null)
    }
  }, [job?.status, job?.candidate_id, onComplete])

  if (!parseJobId) return null

  if (isLoading) {
    return (
      <div className="mt-5 rounded-lg border border-border bg-surface p-5" role="status" aria-live="polite">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mt-5 rounded-lg border border-error/20 bg-error/5 p-5" role="alert">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 shrink-0 text-error" aria-hidden="true" />
          <p className="text-sm text-error">Failed to load parse status</p>
        </div>
      </div>
    )
  }

  if (!job) return null

  const currentStatus = job.status
  const isFailed = currentStatus === 'failed'
  const isCompleted = currentStatus === 'completed'
  const isTerminal = isFailed || isCompleted
  const currentStepIdx = isTerminal ? (isCompleted ? 3 : 2) : getStepIndex(currentStatus)

  return (
    <div
      className="mt-5 rounded-lg border border-border bg-surface p-5"
      role="status"
      aria-live="polite"
    >
      {/* Step progress bar */}
      {!isFailed && (
        <div className="mb-5 flex items-center gap-0">
          {STEPS.filter((s) => s.key !== 'uploading').map((step, i) => {
            const stepIdx = i + 1
            const isDone = stepIdx < currentStepIdx
            const isActive = stepIdx === currentStepIdx
            return (
              <div key={step.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all',
                      isDone
                        ? 'bg-success text-white'
                        : isActive
                          ? 'bg-accent text-white'
                          : 'bg-surface-2 text-text-4',
                    )}
                    aria-hidden="true"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : isActive ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      stepIdx
                    )}
                  </div>
                  <p
                    className={cn(
                      'mt-1 text-[10px] font-medium',
                      isActive ? 'text-text' : isDone ? 'text-success' : 'text-text-4',
                    )}
                  >
                    {step.label}
                  </p>
                </div>
                {i < STEPS.filter((s) => s.key !== 'uploading').length - 1 && (
                  <div
                    className={cn(
                      'mx-1 mb-3 h-px flex-1 transition-all',
                      isDone ? 'bg-success' : 'bg-border',
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Status detail */}
      {isCompleted && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Resume parsed successfully</p>
            <p className="mt-1 text-xs text-text-3">Candidate profile has been created</p>
          </div>
          {job.candidate_id && (
            <Button
              size="sm"
              onClick={() => navigate(`/candidates/${job.candidate_id}`)}
            >
              View Candidate
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}

      {isFailed && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
            <XCircle className="h-6 w-6 text-error" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-error">Parse failed</p>
            {job.error_message && (
              <p className="mt-1 text-xs text-text-3">{job.error_message}</p>
            )}
          </div>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      )}

      {!isTerminal && (
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 shrink-0 rounded-full border-2 border-accent/30 border-t-accent animate-spin"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-text">
              {currentStatus === 'processing' ? 'Parsing resume…' : 'Preparing parse…'}
            </p>
            <p className="text-xs text-text-3">
              {currentStatus === 'processing' && elapsed > 0
                ? `${elapsed}s elapsed`
                : 'Waiting for parser to become available'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
