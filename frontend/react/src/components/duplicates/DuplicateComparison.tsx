import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SkillBadge } from '@/components/candidates/SkillBadge'
import { StatusBadge } from '@/components/candidates/StatusBadge'
import { formatExperience, formatDate, cn } from '@/lib/utils'
import type { DuplicateFlag } from '@/types'

interface DuplicateComparisonProps {
  duplicate: DuplicateFlag
  onResolve: (status: 'confirmed' | 'dismissed') => void
  isResolving: boolean
}

function CandidateColumn({
  candidate,
  label,
}: {
  candidate: DuplicateFlag['candidate_a']
  label: string
}) {
  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-4">
          {label}
        </span>
      </div>
      <div>
        <p className="font-semibold text-text">{candidate.candidate_name ?? 'Unknown'}</p>
        <p className="text-xs text-text-3">{candidate.candidate_email ?? '—'}</p>
      </div>
      <div className="space-y-1.5 text-xs">
        {candidate.current_designation && (
          <p className="text-text-2">
            {candidate.current_designation}
            {candidate.current_company && (
              <span className="text-text-3"> · {candidate.current_company}</span>
            )}
          </p>
        )}
        {candidate.experience_years != null && (
          <p className="text-text-3">{formatExperience(candidate.experience_years)}</p>
        )}
        {candidate.current_location && (
          <p className="text-text-3">{candidate.current_location}</p>
        )}
      </div>
      {candidate.skills && candidate.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {candidate.skills.slice(0, 3).map((skill) => (
            <SkillBadge key={skill} skill={skill} />
          ))}
          {candidate.skills.length > 3 && (
            <span className="self-center text-[10px] text-text-4">
              +{candidate.skills.length - 3}
            </span>
          )}
        </div>
      )}
      <p className="text-[10px] text-text-4 tabular-nums">
        Added {formatDate(candidate.created_at)}
      </p>
    </div>
  )
}

export function DuplicateComparison({
  duplicate,
  onResolve,
  isResolving,
}: DuplicateComparisonProps) {
  const [confirming, setConfirming] = useState(false)
  const confidence = Math.round(duplicate.confidence * 100)
  const isResolved =
    duplicate.status === 'confirmed' || duplicate.status === 'dismissed'

  return (
    <div
      className={cn(
        'rounded-lg border bg-surface overflow-hidden',
        isResolved ? 'border-border/50 opacity-60' : 'border-border',
      )}
    >
      {/* Resolved banner */}
      {isResolved && (
        <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-5 py-2">
          <StatusBadge status={duplicate.status} />
          <span className="text-xs text-text-3">
            {duplicate.status === 'confirmed'
              ? 'Confirmed as duplicate'
              : 'Dismissed as not a duplicate'}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-text-3">
              <span className="font-medium text-text-2">{confidence}%</span> match confidence
              <span className="mx-1.5">·</span>
              {duplicate.reason}
            </p>
          </div>
          {/* Confidence bar */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  confidence >= 80
                    ? 'bg-error'
                    : confidence >= 50
                      ? 'bg-warning'
                      : 'bg-success',
                )}
                style={{ width: `${confidence}%` }}
                role="progressbar"
                aria-valuenow={confidence}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${confidence}% match confidence`}
              />
            </div>
            <span
              className={cn(
                'text-xs font-semibold tabular-nums',
                confidence >= 80
                  ? 'text-error'
                  : confidence >= 50
                    ? 'text-warning'
                    : 'text-success',
              )}
            >
              {confidence}%
            </span>
          </div>
        </div>

        {/* Candidate columns */}
        <div className="flex flex-col gap-5 lg:flex-row lg:gap-0">
          <CandidateColumn candidate={duplicate.candidate_a} label="Candidate A" />
          <div className="flex items-center justify-center lg:flex-col lg:px-5">
            <div className="h-px w-8 bg-border lg:h-12 lg:w-px" />
            <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-text-4 lg:py-2">
              vs
            </span>
            <div className="h-px w-8 bg-border lg:h-12 lg:w-px" />
          </div>
          <CandidateColumn candidate={duplicate.candidate_b} label="Candidate B" />
        </div>

        {/* Actions */}
        {!isResolved && (
          <div className="mt-5 border-t border-border pt-4">
            {confirming ? (
              <div className="flex items-center gap-3">
                <p className="flex-1 text-xs text-text-2">
                  Are you sure you want to confirm these as duplicates?
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(false)}
                  disabled={isResolving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-error text-white hover:bg-error/90 focus-visible:ring-error"
                  onClick={() => onResolve('confirmed')}
                  disabled={isResolving}
                >
                  {isResolving ? 'Confirming…' : 'Yes, confirm duplicate'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResolve('dismissed')}
                  disabled={isResolving}
                >
                  Not a duplicate
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setConfirming(true)}
                  disabled={isResolving}
                >
                  Confirm duplicate
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
