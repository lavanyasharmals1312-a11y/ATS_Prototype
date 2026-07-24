import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/lib/utils'
import type { LoginRequest } from '@/types'

export function useLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      login(response.access_token, response.user)
      toast.success(`Welcome back, ${response.user.full_name.split(' ')[0]}`)
      navigate('/', { replace: true })
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Invalid email or password'))
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })
}
