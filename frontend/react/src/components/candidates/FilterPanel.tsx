import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { CandidateFilters } from '@/types'

interface FilterPanelProps {
  filters: CandidateFilters
  onApply: (filters: CandidateFilters) => void
  total?: number
  showing?: number
}

export function FilterPanel({ filters, onApply, total, showing }: FilterPanelProps) {
  const [search, setSearch] = useState(filters.search ?? '')
  const [skills, setSkills] = useState(filters.skills ?? '')
  const [location, setLocation] = useState(filters.location ?? '')

  // Sync local state if URL params change externally
  useEffect(() => {
    setSearch(filters.search ?? '')
    setSkills(filters.skills ?? '')
    setLocation(filters.location ?? '')
  }, [filters.search, filters.skills, filters.location])

  const apply = useCallback(
    (overrides: Partial<{ search: string; skills: string; location: string }> = {}) => {
      const s = overrides.search !== undefined ? overrides.search : search
      const sk = overrides.skills !== undefined ? overrides.skills : skills
      const lo = overrides.location !== undefined ? overrides.location : location
      onApply({
        search: s || undefined,
        skills: sk || undefined,
        location: lo || undefined,
        page: 1,
      })
    },
    [search, skills, location, onApply],
  )

  const handleClear = () => {
    setSearch('')
    setSkills('')
    setLocation('')
    onApply({ page: 1 })
  }

  const hasFilters = !!(filters.search || filters.skills || filters.location)

  const removeFilter = (key: 'search' | 'skills' | 'location') => {
    if (key === 'search') setSearch('')
    if (key === 'skills') setSkills('')
    if (key === 'location') setLocation('')
    onApply({ ...filters, [key]: undefined, page: 1 })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    apply()
  }

  return (
    <div className="mb-4 space-y-2">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-4"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, company…"
              className="pl-8"
              aria-label="Search candidates"
            />
          </div>

          {/* Skills */}
          <Input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Skills (comma-separated)"
            className="w-44"
            aria-label="Filter by skills"
          />

          {/* Location */}
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-36"
            aria-label="Filter by location"
          />

          <Button type="submit" size="sm">
            <Search className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Search
          </Button>

          {hasFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              <X className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </Button>
          )}

          {total !== undefined && (
            <span className="ml-auto text-xs text-text-3 tabular-nums">
              {showing !== undefined && showing < total
                ? `Showing ${showing} of ${total.toLocaleString()}`
                : `${total.toLocaleString()} candidate${total !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
      </form>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5" aria-label="Active filters">
          {filters.search && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-text-2">
              Search: {filters.search}
              <button
                onClick={() => removeFilter('search')}
                className="rounded-full text-text-3 transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
          {filters.skills && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-text-2">
              Skills: {filters.skills}
              <button
                onClick={() => removeFilter('skills')}
                className="rounded-full text-text-3 transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                aria-label="Remove skills filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-text-2">
              Location: {filters.location}
              <button
                onClick={() => removeFilter('location')}
                className="rounded-full text-text-3 transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                aria-label="Remove location filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
