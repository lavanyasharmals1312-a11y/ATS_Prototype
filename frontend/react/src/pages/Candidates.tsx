import { useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { FilterPanel } from '@/components/candidates/FilterPanel'
import { CandidateTable } from '@/components/candidates/CandidateTable'
import { Button } from '@/components/ui/button'
import { useCandidates } from '@/hooks/useCandidates'
import type { CandidateFilters } from '@/types'

export default function Candidates() {
  const shouldReduceMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: CandidateFilters = {
    search: searchParams.get('search') || undefined,
    skills: searchParams.get('skills') || undefined,
    location: searchParams.get('location') || undefined,
    page: Number(searchParams.get('page')) || 1,
    page_size: 20,
  }

  const { data, isLoading, isError } = useCandidates(filters)

  const handleApplyFilters = useCallback(
    (newFilters: CandidateFilters) => {
      const params = new URLSearchParams()
      if (newFilters.search) params.set('search', newFilters.search)
      if (newFilters.skills) params.set('skills', newFilters.skills)
      if (newFilters.location) params.set('location', newFilters.location)
      if (newFilters.page && newFilters.page > 1) params.set('page', String(newFilters.page))
      setSearchParams(params, { replace: true })
    },
    [setSearchParams],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      handleApplyFilters({ ...filters, page })
    },
    [handleApplyFilters, filters],
  )

  const totalPages = data?.pages ?? 1
  const currentPage = data?.page ?? 1

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <PageHeader
        title="Candidates"
        description="Search and manage your talent pool"
      />

      <FilterPanel filters={filters} onApply={handleApplyFilters} />

      <CandidateTable data={data?.items} isLoading={isLoading} isError={isError} />

      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-text-3 tabular-nums">
            Page {currentPage} of {totalPages} ({data.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
