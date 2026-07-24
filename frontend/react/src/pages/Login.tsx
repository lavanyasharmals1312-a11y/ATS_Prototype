import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Navigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/hooks/useAuth'
import { useAuthStore, selectIsAuthenticated } from '@/store/authStore'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const shouldReduceMotion = useReducedMotion()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const hasHydrated = useAuthStore.persist.hasHydrated()
  const { mutate: login, isPending, isError, error, reset } = useLogin()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Clear API-level error as soon as user changes any field
  useEffect(() => {
    const subscription = watch(() => {
      if (isError) reset()
    })
    return () => subscription.unsubscribe()
  }, [watch, isError, reset])

  if (!hasHydrated) {
    return <LoadingSpinner fullScreen text="Loading…" />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = (data: LoginFormValues) => {
    login(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <motion.div
        className="w-full max-w-sm"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Wordmark */}
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold tracking-tight text-text">
            ProEx<span className="font-normal text-text-3"> ATS</span>
          </p>
          <p className="mt-1 text-sm text-text-3">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-border bg-surface p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-text-2">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@proexlabs.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="flex items-center gap-1 text-xs text-error" role="alert">
                  <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-text-2">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-text-3 transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="flex items-center gap-1 text-xs text-error" role="alert">
                  <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* API Error */}
            {isError && (
              <p className="flex items-center gap-1.5 rounded-md bg-error/10 px-3 py-2 text-xs text-error" role="alert">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {getApiErrorMessage(error, 'Invalid credentials. Please try again.')}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                    aria-hidden="true"
                  />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
