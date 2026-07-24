import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Users, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { SkillBadge } from './SkillBadge'
import { StatusBadge } from './StatusBadge'
import { formatDate, formatExperience, cn } from '@/lib/utils'
import type { CandidateListItem } from '@/types'

interface CandidateTableProps {
  data: CandidateListItem[] | undefined
  isLoading: boolean
  isError: boolean
}

function formatNotice(notice: string | null | undefined): string {
  if (!notice) return '—'
  const lower = notice.toLowerCase()
  if (lower.includes('immediate') || lower === 'imm.' || lower === '0') return 'Imm.'
  const match = notice.match(/(\d+)/)
  if (match) return `${match[1]}d`
  return notice
}

export function CandidateTable({ data, isLoading, isError }: CandidateTableProps) {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border bg-surface-2/60 px-4 py-2.5">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4">
            {['Name', 'Role', 'Skills', 'Exp', 'Added'].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-text-3">
                {h}
              </span>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border/50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-[2] space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <div className="flex-[2] space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex flex-1 gap-1">
                <Skeleton className="h-5 w-14 rounded-sm" />
                <Skeleton className="h-5 w-14 rounded-sm" />
              </div>
              <Skeleton className="h-3.5 w-10 flex-1" />
              <Skeleton className="h-3 w-16 flex-1" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon={Users}
        title="Failed to load candidates"
        description="There was an error fetching candidates. Check your connection and try again."
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No candidates yet"
        description="Upload a resume or import a tracker to add candidates to your pipeline."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Candidates list">
          <thead>
            <tr className="border-b border-border bg-surface-2/60">
              <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3">
                Name
              </th>
              <th scope="col" className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3 lg:table-cell">
                Role
              </th>
              <th scope="col" className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3 xl:table-cell">
                Skills
              </th>
              <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3">
                Exp
              </th>
              <th scope="col" className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3 md:table-cell">
                Notice
              </th>
              <th scope="col" className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3 sm:table-cell">
                Source
              </th>
              <th scope="col" className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3 lg:table-cell">
                Status
              </th>
              <th scope="col" className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-text-3">
                Added
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.map((candidate, index) => (
              <motion.tr
                key={candidate.id}
                className="group cursor-pointer transition-colors hover:bg-surface-2"
                onClick={() => navigate(`/candidates/${candidate.id}`)}
                initial={shouldReduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(index * 0.025, 0.4) }}
              >
                <td className="px-4 py-2.5">
                  <p className="font-medium text-text">{candidate.candidate_name ?? '—'}</p>
                  <p className="text-xs text-text-3">{candidate.candidate_email ?? ''}</p>
                </td>
                <td className="hidden px-4 py-2.5 lg:table-cell">
                  <p className="text-text-2">{candidate.current_designation ?? '—'}</p>
                  <p className="text-xs text-text-4">{candidate.current_company ?? ''}</p>
                </td>
                <td className="hidden px-4 py-2.5 xl:table-cell">
                  <div className="flex flex-wrap items-center gap-1">
                    {candidate.skills?.slice(0, 2).map((skill) => (
                      <SkillBadge key={skill} skill={skill} />
                    ))}
                    {(candidate.skills?.length ?? 0) > 2 && (
                      <span className="text-xs text-text-4">
                        +{candidate.skills!.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      'tabular-nums',
                      candidate.experience_years != null
                        ? 'font-medium text-text'
                        : 'text-text-4',
                    )}
                  >
                    {formatExperience(candidate.experience_years)}
                  </span>
                </td>
                <td className="hidden px-4 py-2.5 text-xs text-text-3 md:table-cell">
                  {formatNotice(candidate.notice_period)}
                </td>
                <td className="hidden px-4 py-2.5 text-xs text-text-3 sm:table-cell">
                  {candidate.source ?? '—'}
                </td>
                <td className="hidden px-4 py-2.5 lg:table-cell">
                  {candidate.duplicate_status ? (
                    <StatusBadge status={candidate.duplicate_status} />
                  ) : (
                    <span className="text-text-4">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs tabular-nums text-text-4">
                      {formatDate(candidate.created_at)}
                    </span>
                    <ArrowRight
                      className="h-3 w-3 text-text-4 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
