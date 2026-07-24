import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { duplicateService } from '@/services/duplicateService'
import type { ResolveDuplicateRequest } from '@/types'
import { getApiErrorMessage } from '@/lib/utils'

export function useDuplicates(params: { status?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['duplicates', params],
    queryFn: () => duplicateService.list(params),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

export function useResolveDuplicate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveDuplicateRequest }) =>
      duplicateService.resolve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicates'] })
      toast.success('Duplicate resolved')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to resolve duplicate'))
    },
  })
}

export function useScanDuplicates() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => duplicateService.scan(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['duplicates'] })
      toast.success(data.message ?? 'Scan complete')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Scan failed'))
    },
  })
}
