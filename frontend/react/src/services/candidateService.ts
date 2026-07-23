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
}
