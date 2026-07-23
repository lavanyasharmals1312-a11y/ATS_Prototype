import { Button } from '@/components/ui/button'
import { SkillBadge } from '@/components/candidates/SkillBadge'
import { formatExperience, formatDate } from '@/lib/utils'
import type { DuplicateFlag } from '@/types'

interface DuplicateComparisonProps {
  duplicate: DuplicateFlag
  onResolve: (status: 'confirmed' | 'dismissed') => void
  isResolving: boolean
}

function CandidateCard({
  candidate,
  side,
}: {
  candidate: DuplicateFlag['candidate_a']
  side: 'A' | 'B'
}) {
  return (
    <div className="flex-1 rounded-lg border border-border bg-surface p-5">
      <div className="mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-accent/10 text-accent border border-accent/20">
          Candidate {side}
        </span>
      </div>

      <h3 className="text-base font-semibold text-text">
        {candidate.candidate_name ?? 'Unknown'}
      </h3>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-3">Email</span>
          <span className="text-text-2">{candidate.candidate_email ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-3">Phone</span>
          <span className="text-text-2">{candidate.candidate_phone ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-3">Company</span>
          <span className="text-text-2">{candidate.current_company ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-3">Designation</span>
          <span className="text-text-2">{candidate.current_designation ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-3">Experience</span>
          <span className="text-text-2 tabular-nums">{formatExperience(candidate.experience_years)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-3">Location</span>
          <span className="text-text-2">{candidate.current_location ?? '—'}</span>
        </div>
      </div>

      {candidate.skills && candidate.skills.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-text-3 mb-1.5">Skills</p>
          <div className="flex flex-wrap gap-1">
            {candidate.skills.map((skill) => (
              <SkillBadge key={skill} skill={skill} />
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-text-4 tabular-nums">
        Added {formatDate(candidate.created_at)}
      </p>
    </div>
  )
}

export function DuplicateComparison({ duplicate, onResolve, isResolving }: DuplicateComparisonProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text">Potential Duplicate</h3>
          <p className="text-xs text-text-3 mt-0.5">
            Match confidence: <span className="font-medium text-accent tabular-nums">{Math.round(duplicate.confidence * 100)}%</span>
            {' — '}
            Reason: {duplicate.reason}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <CandidateCard candidate={duplicate.candidate_a} side="A" />
        <div className="flex items-center justify-center lg:flex-col">
          <div className="h-px w-8 bg-border lg:h-8 lg:w-px" />
          <span className="px-2 text-xs font-medium text-text-4">vs</span>
          <div className="h-px w-8 bg-border lg:h-8 lg:w-px" />
        </div>
        <CandidateCard candidate={duplicate.candidate_b} side="B" />
      </div>

      <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-border">
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
          onClick={() => onResolve('confirmed')}
          disabled={isResolving}
        >
          {isResolving ? 'Resolving...' : 'Confirm duplicate'}
        </Button>
      </div>
    </div>
  )
}
