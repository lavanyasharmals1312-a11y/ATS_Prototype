import { useQuery } from '@tanstack/react-query'
import { resumeService } from '@/services/resumeService'
import type { ParseJob } from '@/types'

export function useParseJob(parseJobId: string | null) {
  return useQuery<ParseJob>({
    queryKey: ['parse-job', parseJobId],
    queryFn: () => resumeService.getParseJob(parseJobId!),
    enabled: !!parseJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'completed' || status === 'failed') return false
      return 2000
    },
    staleTime: 0,
    gcTime: 0,
  })
}
