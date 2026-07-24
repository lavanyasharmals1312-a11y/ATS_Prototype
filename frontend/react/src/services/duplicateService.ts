import { api } from './api'
import type {
  ApiResponse,
  DuplicateFlag,
  PaginatedResponse,
  ResolveDuplicateRequest,
} from '@/types'

export const duplicateService = {
  list: (params: { status?: string; page?: number; page_size?: number }) =>
    api
      .get<ApiResponse<PaginatedResponse<DuplicateFlag>>>('/duplicates', { params })
      .then((r) => r.data.data),

  resolve: (id: string, data: ResolveDuplicateRequest) =>
    api.patch<{ id: string; status: string }>(`/duplicates/${id}`, data).then((r) => r.data),

  scan: () =>
    api.post<{ success: boolean; message: string }>('/duplicates/scan').then((r) => r.data),
}
