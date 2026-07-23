import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  const { mutate: login, isPending, isError, error } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (!hasHydrated) {
    return <LoadingSpinner fullScreen text="Loading..." />
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
        className="w-full max-w-md"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
            <span className="text-lg font-bold text-accent">PX</span>
          </div>
          <h1 className="text-2xl font-semibold text-text tracking-tight">ProEx Labs ATS</h1>
          <p className="mt-1 text-sm text-text-3">Sign in to your recruiter account</p>
        </div>

        <Card className="border-border bg-surface backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@proexlabs.com"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-error flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-error flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {isError && (
                <p className="text-sm text-error flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {getApiErrorMessage(error, 'Login failed')}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
