import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/services/authService'
import { getApiErrorMessage } from '@/lib/utils'

const resetPasswordSchema = z.object({
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
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
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  })

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <Card className="w-full max-w-md border-border bg-surface">
          <CardContent className="pt-6 text-center">
            <p className="text-error mb-4">Invalid or missing reset token.</p>
            <Button asChild><Link to="/login">Go to login</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: ResetPasswordFormValues) => {
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
        </div>

        <Card className="border-border bg-surface backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Create new password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-text-2">
                  Your password has been successfully updated.
                </p>
                <Button asChild className="w-full mt-4">
                  <Link to="/login">Sign in with new password</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.new_password}
                    {...register('new_password')}
                  />
                  {errors.new_password && (
                    <p className="text-sm text-error flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {errors.new_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.confirm_password}
                    {...register('confirm_password')}
                  />
                  {errors.confirm_password && (
                    <p className="text-sm text-error flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>

                {error ? (
                  <p className="text-sm text-error flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {getApiErrorMessage(error, 'Reset failed')}
                  </p>
                ) : null}

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'Updating...' : 'Update password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
