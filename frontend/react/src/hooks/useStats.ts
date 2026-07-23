import { useQuery } from '@tanstack/react-query'
import { statsService } from '@/services/statsService'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => statsService.get(),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
