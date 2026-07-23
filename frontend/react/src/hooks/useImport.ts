import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { importService } from '@/services/importService'
import { getApiErrorMessage } from '@/lib/utils'

export function useImportBatches(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['import-batches', params],
    queryFn: () => importService.list(params),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

export function useImportBatch(id: string | undefined) {
  return useQuery({
    queryKey: ['import-batch', id],
    queryFn: () => importService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useUploadTracker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => importService.uploadTracker(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-batches'] })
      toast.success('Tracker uploaded — processing started')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Upload failed'))
    },
  })
}
