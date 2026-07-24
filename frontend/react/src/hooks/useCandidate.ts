import { useQuery } from '@tanstack/react-query'
import { candidateService } from '@/services/candidateService'

export function useCandidate(id: string | undefined) {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidateService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
