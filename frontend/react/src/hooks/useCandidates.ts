import { useQuery } from '@tanstack/react-query'
import { candidateService } from '@/services/candidateService'
import type { CandidateFilters } from '@/types'

export function useCandidates(filters: CandidateFilters) {
  return useQuery({
    queryKey: ['candidates', filters],
    queryFn: () => candidateService.list(filters),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
