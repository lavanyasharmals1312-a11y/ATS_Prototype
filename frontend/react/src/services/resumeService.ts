import { api } from './api'
import type { ParseJob, ResumeUploadResponse } from '@/types'

export const resumeService = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<ResumeUploadResponse>('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  getParseJob: (id: string) =>
    api.get<ParseJob>(`/parse-jobs/${id}`).then((r) => r.data),

  retryParseJob: (id: string) =>
    api.post<{ parse_job_id: string; status: string }>(`/parse-jobs/${id}/retry`).then((r) => r.data),
}
