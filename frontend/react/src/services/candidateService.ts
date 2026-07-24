import { api } from './api'
import type {
  ApiResponse,
  Candidate,
  CandidateFilters,
  CandidateUpdate,
  PaginatedResponse,
  CandidateListItem,
} from '@/types'

export const candidateService = {
  list: (params: CandidateFilters) =>
    api
      .get<ApiResponse<PaginatedResponse<CandidateListItem>>>('/candidates', { params })
      .then((r) => r.data.data),

  getById: (id: string) =>
    api.get<ApiResponse<Candidate>>(`/candidates/${id}`).then((r) => r.data.data),

  update: (id: string, data: CandidateUpdate) =>
    api.patch<ApiResponse<Candidate>>(`/candidates/${id}`, data).then((r) => r.data.data),

  deactivate: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/candidates/${id}`).then((r) => r.data),

  exportExcel: (params: Omit<CandidateFilters, 'page' | 'page_size'>) =>
    api
      .get('/candidates/export/excel', {
        params,
        responseType: 'blob',
      })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]))
        const link = document.createElement('a')
        link.href = url
        // Try to get filename from Content-Disposition header
        const cd = r.headers['content-disposition'] as string | undefined
        const match = cd?.match(/filename="?([^"]+)"?/)
        link.download = match?.[1] ?? `candidates_${Date.now()}.xlsx`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      }),
}

