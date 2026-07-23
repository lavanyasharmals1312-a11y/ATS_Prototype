import { useParams, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Edit, ExternalLink, Mail, Phone, MapPin, Briefcase, GraduationCap, DollarSign, FileText, Clock, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { SkillBadge } from '@/components/candidates/SkillBadge'
import { StatusBadge } from '@/components/candidates/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useCandidate } from '@/hooks/useCandidate'
import { formatDate, formatExperience } from '@/lib/utils'

function DetailRow({ label, value, icon: Icon }: { label: string; value: string | null; icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 rounded bg-surface-2 p-1.5">
        <Icon className="h-4 w-4 text-text-3" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text-3 uppercase tracking-widest">{label}</p>
        <p className="mt-0.5 text-sm text-text">{value ?? '—'}</p>
      </div>
    </div>
  )
}

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
        <PageHeader title="Candidate Profile" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
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
        <PageHeader title="Candidate Profile" />
        <EmptyState
          icon={AlertCircle}
          title="Candidate not found"
          description="This candidate may have been removed or you may have followed an invalid link."
          action={
            <Button variant="ghost" onClick={() => navigate('/candidates')}>
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
        description={candidate.current_designation ?? ''}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Back
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/candidates/${candidate.id}/edit`)}>
              <Edit className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Edit
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-text mb-1">Contact Information</h2>
            <div className="mt-3 divide-y divide-border/50">
              <DetailRow label="Email" value={candidate.candidate_email} icon={Mail} />
              <DetailRow label="Phone" value={candidate.candidate_phone} icon={Phone} />
              <DetailRow label="Location" value={candidate.current_location} icon={MapPin} />
              <DetailRow label="Preferred Location" value={candidate.preferred_location} icon={MapPin} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-text mb-1">Professional Details</h2>
            <div className="mt-3 divide-y divide-border/50">
              <DetailRow label="Current Company" value={candidate.current_company} icon={Briefcase} />
              <DetailRow label="Designation" value={candidate.current_designation} icon={Briefcase} />
              <DetailRow label="Experience" value={formatExperience(candidate.experience_years)} icon={Clock} />
              <DetailRow label="Highest Qualification" value={candidate.highest_qualification} icon={GraduationCap} />
              <DetailRow label="University" value={candidate.university} icon={GraduationCap} />
              <DetailRow label="Notice Period" value={candidate.notice_period} icon={Clock} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-text mb-1">Compensation</h2>
            <div className="mt-3 divide-y divide-border/50">
              <DetailRow label="Current CTC" value={candidate.current_ctc} icon={DollarSign} />
              <DetailRow label="Expected CTC" value={candidate.expected_ctc} icon={DollarSign} />
            </div>
          </div>

          {candidate.notes && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-base font-semibold text-text mb-1">Notes</h2>
              <p className="mt-2 text-sm text-text-2 whitespace-pre-wrap">{candidate.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-text mb-3">Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-3">Duplicate</span>
                {candidate.duplicate_status ? (
                  <StatusBadge status={candidate.duplicate_status} />
                ) : (
                  <span className="text-xs text-text-4">—</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-3">Active</span>
                <span className={`text-xs font-medium ${candidate.is_active ? 'text-success' : 'text-text-4'}`}>
                  {candidate.is_active ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-3">Source</span>
                <span className="text-xs text-text-2">{candidate.source ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-3">Added</span>
                <span className="text-xs text-text-2 tabular-nums">{formatDate(candidate.created_at)}</span>
              </div>
            </div>
          </div>

          {candidate.skills && candidate.skills.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold text-text mb-3">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <SkillBadge key={skill} skill={skill} />
                ))}
              </div>
            </div>
          )}

          {candidate.tags && candidate.tags.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold text-text mb-3">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {candidate.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border-border bg-surface-3 text-text-2 border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {candidate.resumes && candidate.resumes.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold text-text mb-3">
                <FileText className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                Resumes
              </h2>
              <div className="space-y-2">
                {candidate.resumes.map((resume) => (
                  <a
                    key={resume.id}
                    href={`/api/v1/candidates/${candidate.id}/resume`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2 text-sm text-text-2 hover:bg-surface-3 transition-colors"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span className="flex-1 truncate">{resume.original_filename}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-text-4" aria-hidden="true" />
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
