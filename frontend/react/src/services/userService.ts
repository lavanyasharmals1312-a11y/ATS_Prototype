import { api } from './api'
import type { User, UserCreate, UserUpdate, ApiResponse } from '@/types'

export const userService = {
  list: () => api.get<User[]>('/users').then((r) => r.data),
  
  create: (data: UserCreate) => api.post<User>('/users', data).then((r) => r.data),
  
  update: (id: string, data: UserUpdate) => api.patch<User>(`/users/${id}`, data).then((r) => r.data),
  
  delete: (id: string) => api.delete<ApiResponse<null>>(`/users/${id}`).then((r) => r.data),
}
