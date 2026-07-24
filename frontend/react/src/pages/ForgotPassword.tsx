import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/authService'
import { getApiErrorMessage } from '@/lib/utils'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
  const shouldReduceMotion = useReducedMotion()
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  // Clear API error when user types
  useEffect(() => {
    const sub = watch(() => {
      if (error) setError(null)
    })
    return () => sub.unsubscribe()
  }, [watch, error])

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsPending(true)
    setError(null)
    try {
      await authService.forgotPassword(data)
      setIsSuccess(true)
    } catch (err) {
      setError(err)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <motion.div
        className="w-full max-w-sm"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold tracking-tight text-text">
            ProEx<span className="font-normal text-text-3"> ATS</span>
          </p>
          <p className="mt-1 text-sm text-text-3">Reset your password</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-7">
          {isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Check your inbox</p>
                <p className="mt-1 text-xs text-text-3">
                  If an account exists with that email, you'll receive a password reset link shortly.
                </p>
              </div>
              <Link
                to="/login"
                className="flex items-center gap-1 text-xs text-text-3 transition-colors hover:text-text"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <p className="text-sm font-medium text-text">Forgot your password?</p>
                <p className="mt-1 text-xs text-text-3">
                  Enter your email address and we'll send you a reset link.
                </p>
              </div>

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

              {error ? (
                <p className="flex items-center gap-1.5 rounded-md bg-error/10 px-3 py-2 text-xs text-error" role="alert">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {getApiErrorMessage(error, 'Request failed. Please try again.')}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>

              <div className="pt-1 text-center">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1 text-xs text-text-3 transition-colors hover:text-text"
                >
                  <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
