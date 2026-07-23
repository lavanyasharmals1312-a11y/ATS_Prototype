import { api } from './api'
import type { LoginRequest, TokenResponse, User } from '@/types'

export const authService = {
  login: (data: LoginRequest) =>
    api.post<TokenResponse>('/auth/login', data).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),

  logout: () => api.post<{ success: boolean; message: string }>('/auth/logout').then((r) => r.data),
}
