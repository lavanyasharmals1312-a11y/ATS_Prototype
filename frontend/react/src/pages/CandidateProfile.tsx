import { useParams, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  Building2,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { DetailRow } from '@/components/common/DetailRow'
import { SkillBadge } from '@/components/candidates/SkillBadge'
import { StatusBadge } from '@/components/candidates/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useCandidate } from '@/hooks/useCandidate'
import { formatDate, formatExperience } from '@/lib/utils'

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const { data: candidate, isLoading, isError } = useCandidate(id)

  if (isLoading) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="mb-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-1.5 h-4 w-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
      </motion.div>
    )
  }

  if (isError || !candidate) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <EmptyState
          icon={AlertCircle}
          title="Candidate not found"
          description="This candidate may have been removed or you may have followed an invalid link."
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/candidates')}>
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Back to candidates
            </Button>
          }
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <PageHeader
        title={candidate.candidate_name ?? 'Candidate Profile'}
        description={
          [candidate.current_designation, candidate.current_company]
            .filter(Boolean)
            .join(' at ') || undefined
        }
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/candidates/${candidate.id}/edit`)}
            >
              <Edit className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
          </>
        }
      />

      {/* Status chips row */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            candidate.is_active
              ? 'bg-success/10 text-success'
              : 'bg-surface-2 text-text-4'
          }`}
        >
          {candidate.is_active ? 'Active' : 'Inactive'}
        </span>
        {candidate.duplicate_status && (
          <StatusBadge status={candidate.duplicate_status} />
        )}
        {candidate.source && (
          <span className="inline-flex items-center rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-text-2">
            {candidate.source}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Contact */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <SectionHeader title="Contact Information" />
            <div className="divide-y divide-border/40">
              <DetailRow
                label="Email"
                value={candidate.candidate_email}
                icon={Mail}
                href={candidate.candidate_email ? `mailto:${candidate.candidate_email}` : undefined}
              />
              <DetailRow
                label="Phone"
                value={candidate.candidate_phone}
                icon={Phone}
                href={candidate.candidate_phone ? `tel:${candidate.candidate_phone}` : undefined}
              />
              <DetailRow label="Current Location" value={candidate.current_location} icon={MapPin} />
              <DetailRow label="Preferred Location" value={candidate.preferred_location} icon={MapPin} />
            </div>
          </div>

          {/* Professional */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <SectionHeader title="Professional Details" />
            <div className="divide-y divide-border/40">
              <DetailRow label="Current Role" value={candidate.current_designation} icon={Briefcase} />
              <DetailRow label="Company" value={candidate.current_company} icon={Building2} />
              <DetailRow label="Experience" value={formatExperience(candidate.experience_years)} icon={Clock} />
              <DetailRow label="Notice Period" value={candidate.notice_period} icon={Clock} />
              <DetailRow label="Highest Qualification" value={candidate.highest_qualification} icon={GraduationCap} />
              <DetailRow label="University" value={candidate.university} icon={GraduationCap} />
            </div>
          </div>

          {/* Compensation */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <SectionHeader title="Compensation" />
            <div className="grid grid-cols-2 gap-0 divide-y divide-border/40 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="py-4 sm:pr-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-3">
                  Current CTC
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-text-3" aria-hidden="true" />
                  <p className={candidate.current_ctc ? 'text-sm text-text' : 'text-sm italic text-text-4'}>
                    {candidate.current_ctc ?? 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="py-4 sm:pl-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-3">
                  Expected CTC
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-text-3" aria-hidden="true" />
                  <p className={candidate.expected_ctc ? 'text-sm text-text' : 'text-sm italic text-text-4'}>
                    {candidate.expected_ctc ?? 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {candidate.notes && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <SectionHeader title="Notes" />
              <blockquote className="border-l-2 border-accent pl-4">
                <p className="text-sm text-text-2 whitespace-pre-wrap">{candidate.notes}</p>
              </blockquote>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status panel */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <SectionHeader title="Details" />
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-xs text-text-3">Status</dt>
                <dd>
                  {candidate.is_active ? (
                    <span className="text-xs font-medium text-success">Active</span>
                  ) : (
                    <span className="text-xs font-medium text-text-4">Inactive</span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-text-3">Duplicate</dt>
                <dd>
                  {candidate.duplicate_status ? (
                    <StatusBadge status={candidate.duplicate_status} />
                  ) : (
                    <span className="text-xs text-text-4">—</span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-text-3">Source</dt>
                <dd className="text-xs text-text-2">{candidate.source ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-text-3">Added</dt>
                <dd className="text-xs tabular-nums text-text-2">{formatDate(candidate.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-text-3">Updated</dt>
                <dd className="text-xs tabular-nums text-text-2">{formatDate(candidate.updated_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <SectionHeader title="Skills" />
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <SkillBadge key={skill} skill={skill} />
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {candidate.tags && candidate.tags.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <SectionHeader title="Tags" />
              <div className="flex flex-wrap gap-1.5">
                {candidate.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-sm border border-border px-2 py-0.5 text-xs font-medium text-text-2"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resumes */}
          {candidate.resumes && candidate.resumes.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <SectionHeader title="Resumes" />
              <div className="space-y-2">
                {candidate.resumes.map((resume) => (
                  <a
                    key={resume.id}
                    href={`/api/v1/candidates/${candidate.id}/resume`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2 text-sm text-text-2 transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-text">
                        {resume.original_filename}
                      </p>
                      <p className="text-[10px] text-text-4 tabular-nums">
                        {formatDate(resume.uploaded_at)}
                      </p>
                    </div>
                    <ExternalLink
                      className="h-3.5 w-3.5 shrink-0 text-text-4 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
