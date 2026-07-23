import { api } from './api'
import type { ApiResponse, ImportBatch, ImportUploadResponse, PaginatedResponse } from '@/types'

export const importService = {
  uploadTracker: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<ImportUploadResponse>('/imports/trackers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  list: (params?: { page?: number; page_size?: number }) =>
    api
      .get<ApiResponse<PaginatedResponse<ImportBatch>>>('/imports', { params })
      .then((r) => r.data.data),

  getById: (id: string) =>
    api.get<ApiResponse<ImportBatch>>(`/imports/${id}`).then((r) => r.data.data),
}
