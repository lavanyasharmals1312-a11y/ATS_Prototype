import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/common/EmptyState'
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

export default function CandidateEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const queryClient = useQueryClient()

  const { data: candidate, isLoading, isError } = useCandidate(id)

  const {
    register,
    handleSubmit,
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
      toast.success('Candidate updated')
      navigate(`/candidates/${id}`)
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Update failed'))
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
      skills: formData.skills ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
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
          <Skeleton className="h-96 rounded-lg" />
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
          icon={ArrowLeft}
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
        title="Edit Candidate"
        description={`Editing ${candidate.candidate_name ?? 'candidate'}`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(`/candidates/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-text mb-4">Contact Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="candidate_name">Full Name</Label>
                <Input id="candidate_name" {...register('candidate_name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidate_email">Email</Label>
                <Input id="candidate_email" type="email" aria-invalid={!!errors.candidate_email} {...register('candidate_email')} />
                {errors.candidate_email && <p className="text-xs text-error">{errors.candidate_email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidate_phone">Phone</Label>
                <Input id="candidate_phone" {...register('candidate_phone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_location">Current Location</Label>
                <Input id="current_location" {...register('current_location')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_location">Preferred Location</Label>
                <Input id="preferred_location" {...register('preferred_location')} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-text mb-4">Professional Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current_company">Current Company</Label>
                <Input id="current_company" {...register('current_company')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_designation">Designation</Label>
                <Input id="current_designation" {...register('current_designation')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience_years">Experience (years)</Label>
                <Input id="experience_years" type="number" min={0} max={50} {...register('experience_years')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notice_period">Notice Period</Label>
                <Input id="notice_period" placeholder="e.g. 30 days" {...register('notice_period')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="highest_qualification">Highest Qualification</Label>
                <Input id="highest_qualification" {...register('highest_qualification')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input id="university" {...register('university')} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-text mb-4">Compensation</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current_ctc">Current CTC</Label>
                <Input id="current_ctc" placeholder="e.g. ₹12,00,000" {...register('current_ctc')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_ctc">Expected CTC</Label>
                <Input id="expected_ctc" placeholder="e.g. ₹18,00,000" {...register('expected_ctc')} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-text mb-4">Skills & Tags</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input id="skills" placeholder="React, Python, TypeScript..." {...register('skills')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" placeholder="Urgent, Remote-ready..." {...register('tags')} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-text mb-4">Notes</h2>
            <div className="space-y-2">
              <Label htmlFor="notes" className="sr-only">Notes</Label>
              <textarea
                id="notes"
                rows={4}
                className="w-full rounded bg-surface border border-border px-3 py-2 text-sm text-text placeholder:text-text-4 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors resize-y"
                placeholder="Internal notes about this candidate..."
                {...register('notes')}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pb-8">
            <Button variant="ghost" type="button" onClick={() => navigate(`/candidates/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" aria-hidden="true" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  )
}
