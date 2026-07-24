import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useWatch } from 'react-hook-form'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/common/EmptyState'
import { SkillBadge } from '@/components/candidates/SkillBadge'
import { useCandidate } from '@/hooks/useCandidate'
import { candidateService } from '@/services/candidateService'
import { getApiErrorMessage } from '@/lib/utils'
import type { CandidateUpdate } from '@/types'

const editSchema = z.object({
  candidate_name: z.string().optional(),
  candidate_email: z.string().email('Invalid email').optional().or(z.literal('')),
  candidate_phone: z.string().optional(),
  current_designation: z.string().optional(),
  current_company: z.string().optional(),
  experience_years: z.coerce.number().min(0).max(50).optional().or(z.literal('')),
  current_location: z.string().optional(),
  preferred_location: z.string().optional(),
  notice_period: z.string().optional(),
  current_ctc: z.string().optional(),
  expected_ctc: z.string().optional(),
  highest_qualification: z.string().optional(),
  university: z.string().optional(),
  skills: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
})

type EditFormValues = z.infer<typeof editSchema>

function LiveChips({ value }: { value: string | undefined }) {
  const chips = (value ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 pt-1">
      {chips.map((chip) => (
        <SkillBadge key={chip} skill={chip} />
      ))}
    </div>
  )
}

function SkillsPreview({ control, name }: { control: ReturnType<typeof useForm<EditFormValues>>['control']; name: 'skills' | 'tags' }) {
  const value = useWatch({ control, name })
  return <LiveChips value={value} />
}

export default function CandidateEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const queryClient = useQueryClient()

  const { data: candidate, isLoading, isError } = useCandidate(id)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: candidate
      ? {
          candidate_name: candidate.candidate_name ?? '',
          candidate_email: candidate.candidate_email ?? '',
          candidate_phone: candidate.candidate_phone ?? '',
          current_designation: candidate.current_designation ?? '',
          current_company: candidate.current_company ?? '',
          experience_years: candidate.experience_years ?? undefined,
          current_location: candidate.current_location ?? '',
          preferred_location: candidate.preferred_location ?? '',
          notice_period: candidate.notice_period ?? '',
          current_ctc: candidate.current_ctc ?? '',
          expected_ctc: candidate.expected_ctc ?? '',
          highest_qualification: candidate.highest_qualification ?? '',
          university: candidate.university ?? '',
          skills: candidate.skills?.join(', ') ?? '',
          tags: candidate.tags?.join(', ') ?? '',
          notes: candidate.notes ?? '',
        }
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (data: CandidateUpdate) => candidateService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', id] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate updated successfully')
      navigate(`/candidates/${id}`)
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Update failed'))
    },
  })

  const onSubmit = (formData: EditFormValues) => {
    const payload: CandidateUpdate = {
      candidate_name: formData.candidate_name || undefined,
      candidate_email: formData.candidate_email || undefined,
      candidate_phone: formData.candidate_phone || undefined,
      current_designation: formData.current_designation || undefined,
      current_company: formData.current_company || undefined,
      experience_years: formData.experience_years ? Number(formData.experience_years) : undefined,
      current_location: formData.current_location || undefined,
      preferred_location: formData.preferred_location || undefined,
      notice_period: formData.notice_period || undefined,
      current_ctc: formData.current_ctc || undefined,
      expected_ctc: formData.expected_ctc || undefined,
      highest_qualification: formData.highest_qualification || undefined,
      university: formData.university || undefined,
      skills: formData.skills
        ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      tags: formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
      notes: formData.notes || undefined,
    }
    updateMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <PageHeader title="Edit Candidate" />
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
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
        <PageHeader title="Edit Candidate" />
        <EmptyState
          icon={AlertCircle}
          title="Candidate not found"
          description="This candidate may have been removed."
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
        title={
          <span className="flex items-center gap-2">
            {candidate.candidate_name ?? 'Edit Candidate'}
            {isDirty && (
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-warning"
                title="Unsaved changes"
                aria-label="Unsaved changes"
              />
            )}
          </span>
        }
        description="Edit candidate information"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/candidates/${id}`)}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Personal */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <SectionHeader title="Personal Information" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="candidate_name" className="text-xs text-text-2">Full Name</Label>
                <Input id="candidate_name" placeholder="Jane Doe" {...register('candidate_name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="candidate_email" className="text-xs text-text-2">Email</Label>
                <Input
                  id="candidate_email"
                  type="email"
                  placeholder="jane@example.com"
                  aria-invalid={!!errors.candidate_email}
                  {...register('candidate_email')}
                />
                {errors.candidate_email && (
                  <p className="text-xs text-error">{errors.candidate_email.message}</p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="candidate_phone" className="text-xs text-text-2">Phone</Label>
                <Input id="candidate_phone" type="tel" placeholder="+91 98765 43210" {...register('candidate_phone')} />
              </div>
            </div>
          </div>

          {/* Professional */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <SectionHeader title="Professional Details" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="current_designation" className="text-xs text-text-2">Job Title</Label>
                <Input id="current_designation" placeholder="Senior Engineer" {...register('current_designation')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="current_company" className="text-xs text-text-2">Current Company</Label>
                <Input id="current_company" placeholder="Acme Corp" {...register('current_company')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="experience_years" className="text-xs text-text-2">Experience (years)</Label>
                <Input id="experience_years" type="number" min={0} max={50} step={0.5} placeholder="5" {...register('experience_years')} />
                {errors.experience_years && (
                  <p className="text-xs text-error">{String(errors.experience_years.message)}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notice_period" className="text-xs text-text-2">Notice Period</Label>
                <Input id="notice_period" placeholder="30 days" {...register('notice_period')} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <SectionHeader title="Location" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="current_location" className="text-xs text-text-2">Current Location</Label>
                <Input id="current_location" placeholder="Bengaluru, India" {...register('current_location')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preferred_location" className="text-xs text-text-2">Preferred Location</Label>
                <Input id="preferred_location" placeholder="Remote / Mumbai" {...register('preferred_location')} />
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <SectionHeader title="Education" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="highest_qualification" className="text-xs text-text-2">Highest Qualification</Label>
                <Input id="highest_qualification" placeholder="B.Tech" {...register('highest_qualification')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="university" className="text-xs text-text-2">University / Institute</Label>
                <Input id="university" placeholder="IIT Delhi" {...register('university')} />
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <SectionHeader title="Compensation" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="current_ctc" className="text-xs text-text-2">Current CTC</Label>
                <Input id="current_ctc" placeholder="₹12,00,000" {...register('current_ctc')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expected_ctc" className="text-xs text-text-2">Expected CTC</Label>
                <Input id="expected_ctc" placeholder="₹18,00,000" {...register('expected_ctc')} />
              </div>
            </div>
          </div>

          {/* Skills & Tags */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <SectionHeader title="Skills & Tags" />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="skills" className="text-xs text-text-2">Skills</Label>
                <Input
                  id="skills"
                  placeholder="React, Python, TypeScript…"
                  {...register('skills')}
                />
                <p className="text-[10px] text-text-4">Separate skills with commas</p>
                <SkillsPreview control={control} name="skills" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tags" className="text-xs text-text-2">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Urgent, Remote-ready…"
                  {...register('tags')}
                />
                <p className="text-[10px] text-text-4">Separate tags with commas</p>
                <SkillsPreview control={control} name="tags" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <SectionHeader title="Notes" />
            <textarea
              id="notes"
              rows={4}
              className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 text-sm text-text placeholder:text-text-4 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Internal notes about this candidate…"
              {...register('notes')}
            />
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 mt-6 border-t border-border bg-bg/80 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <p className="text-xs text-text-3">
              {isDirty ? 'You have unsaved changes' : 'No changes made'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                type="button"
                size="sm"
                onClick={() => navigate(`/candidates/${id}`)}
              >
                Discard
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!isDirty || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  )
}
