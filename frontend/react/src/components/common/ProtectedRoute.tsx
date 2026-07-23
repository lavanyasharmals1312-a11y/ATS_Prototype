import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, selectIsAuthenticated } from '@/store/authStore'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const location = useLocation()

  // Zustand persist rehydrates asynchronously
  const hasHydrated = useAuthStore.persist.hasHydrated()

  if (!hasHydrated) {
    return <LoadingSpinner fullScreen text="Loading session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
