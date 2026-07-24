import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/authService'
import { getApiErrorMessage } from '@/lib/utils'

const resetPasswordSchema = z
  .object({
    new_password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPassword() {
  const shouldReduceMotion = useReducedMotion()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  })

  // Clear API error when user types
  useEffect(() => {
    const sub = watch(() => {
      if (error) setError(null)
    })
    return () => sub.unsubscribe()
  }, [watch, error])

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) return
    setIsPending(true)
    setError(null)
    try {
      await authService.resetPassword({ token, new_password: data.new_password })
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
          <p className="mt-1 text-sm text-text-3">Create a new password</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-7">
          {!token ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
                <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Invalid reset link</p>
                <p className="mt-1 text-xs text-text-3">
                  This link is missing a reset token. Please request a new one.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="text-xs text-accent transition-colors hover:text-accent-hover"
              >
                Request new link
              </Link>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Password updated</p>
                <p className="mt-1 text-xs text-text-3">
                  Your password has been successfully changed. You can now sign in.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/login">Sign in with new password</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <p className="text-sm font-medium text-text">Set new password</p>
                <p className="mt-1 text-xs text-text-3">
                  Choose a strong password of at least 6 characters.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new_password" className="text-xs font-medium text-text-2">
                  New Password
                </Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.new_password}
                  {...register('new_password')}
                />
                {errors.new_password && (
                  <p className="flex items-center gap-1 text-xs text-error" role="alert">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {errors.new_password.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm_password" className="text-xs font-medium text-text-2">
                  Confirm Password
                </Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.confirm_password}
                  {...register('confirm_password')}
                />
                {errors.confirm_password && (
                  <p className="flex items-center gap-1 text-xs text-error" role="alert">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              {error ? (
                <p className="flex items-center gap-1.5 rounded-md bg-error/10 px-3 py-2 text-xs text-error" role="alert">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {getApiErrorMessage(error, 'Reset failed. The link may have expired.')}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                    Updating…
                  </>
                ) : (
                  'Update password'
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
