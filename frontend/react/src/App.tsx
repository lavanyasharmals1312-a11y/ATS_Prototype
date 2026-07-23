import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Upload = lazy(() => import('@/pages/Upload'))
const Candidates = lazy(() => import('@/pages/Candidates'))
const CandidateProfile = lazy(() => import('@/pages/CandidateProfile'))
const CandidateEdit = lazy(() => import('@/pages/CandidateEdit'))
const Duplicates = lazy(() => import('@/pages/Duplicates'))
const Import = lazy(() => import('@/pages/Import'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'upload',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Upload />
          </Suspense>
        ),
      },
      {
        path: 'candidates',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Candidates />
          </Suspense>
        ),
      },
      {
        path: 'candidates/:id',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <CandidateProfile />
          </Suspense>
        ),
      },
      {
        path: 'candidates/:id/edit',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <CandidateEdit />
          </Suspense>
        ),
      },
      {
        path: 'duplicates',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Duplicates />
          </Suspense>
        ),
      },
      {
        path: 'import',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Import />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: 'bg-surface border-border text-text',
              description: 'text-text-3',
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
