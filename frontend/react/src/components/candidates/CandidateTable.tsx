import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Users } from 'lucide-react'
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

export function CandidateTable({ data, isLoading, isError }: CandidateTableProps) {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <div className="divide-y divide-border/50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-20 rounded-sm" />
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
        description="There was an error fetching candidates. Please try again."
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No candidates yet"
        description="Upload a resume or import a tracker to get started."
      />
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase tracking-widest">Name</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase tracking-widest hidden md:table-cell">Contact</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase tracking-widest hidden lg:table-cell">Current</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase tracking-widest hidden xl:table-cell">Skills</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase tracking-widest">Exp</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase tracking-widest hidden sm:table-cell">Source</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-3 uppercase tracking-widest hidden lg:table-cell">Status</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-text-3 uppercase tracking-widest">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.map((candidate, index) => (
              <motion.tr
                key={candidate.id}
                className="transition-colors hover:bg-surface-2 cursor-pointer"
                onClick={() => navigate(`/candidates/${candidate.id}`)}
                initial={shouldReduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{candidate.candidate_name ?? '—'}</p>
                </td>
                <td className="px-4 py-3 text-text-2 hidden md:table-cell">
                  <p>{candidate.candidate_email ?? '—'}</p>
                  <p className="text-text-4 text-xs">{candidate.candidate_phone ?? ''}</p>
                </td>
                <td className="px-4 py-3 text-text-2 hidden lg:table-cell">
                  <p>{candidate.current_designation ?? '—'}</p>
                  <p className="text-text-4 text-xs">{candidate.current_company ?? ''}</p>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills?.slice(0, 3).map((skill) => (
                      <SkillBadge key={skill} skill={skill} />
                    ))}
                    {(candidate.skills?.length ?? 0) > 3 && (
                      <span className="text-xs text-text-4 self-center">+{candidate.skills!.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('tabular-nums text-text-2', candidate.experience_years != null && 'font-medium text-text')}>
                    {formatExperience(candidate.experience_years)}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-2 hidden sm:table-cell">{candidate.source ?? '—'}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {candidate.duplicate_status ? (
                    <StatusBadge status={candidate.duplicate_status} />
                  ) : (
                    <span className="text-text-4">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-text-3 text-xs tabular-nums">{formatDate(candidate.created_at)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
