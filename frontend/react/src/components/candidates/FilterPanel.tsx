import { useForm } from 'react-hook-form'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { CandidateFilters } from '@/types'

interface FilterPanelProps {
  filters: CandidateFilters
  onApply: (filters: CandidateFilters) => void
}

export function FilterPanel({ filters, onApply }: FilterPanelProps) {
  const { register, handleSubmit, reset } = useForm<CandidateFilters>({
    defaultValues: filters,
  })

  const onSubmit = (data: CandidateFilters) => {
    onApply({ ...data, page: 1 })
  }

  const handleClear = () => {
    reset({ search: '', skills: '', location: '' })
    onApply({ page: 1 })
  }

  const hasFilters = filters.search || filters.skills || filters.location

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-4" aria-hidden="true" />
          <Input
            placeholder="Search by name, email, company..."
            className="pl-9"
            {...register('search')}
          />
        </div>

        <div className="w-40">
          <Input placeholder="Skills (comma-sep)" {...register('skills')} />
        </div>

        <div className="w-40">
          <Input placeholder="Location" {...register('location')} />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm">
            <Search className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Search
          </Button>

          {hasFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              <X className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
