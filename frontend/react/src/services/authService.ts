import { api } from './api'
import type { LoginRequest, TokenResponse, User, ForgotPasswordRequest, ResetPasswordRequest, ApiResponse } from '@/types'

export const authService = {
  login: (data: LoginRequest) =>
    api.post<TokenResponse>('/auth/login', data).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),

  logout: () => api.post<ApiResponse<null>>('/auth/logout').then((r) => r.data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<ApiResponse<null>>('/auth/forgot-password', data).then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<ApiResponse<null>>('/auth/reset-password', data).then((r) => r.data),
}
