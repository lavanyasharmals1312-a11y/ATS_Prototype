import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

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
            <CardTitle>Reset password</CardTitle>
            <CardDescription>Enter your email to receive a reset link</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-text-2">
                  If an account exists for that email, a password reset link has been generated.
                </p>
                <p className="text-xs text-text-3 font-mono mt-2">
                  (Check the backend terminal to see the link!)
                </p>
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link to="/login">Return to login</Link>
                </Button>
              </div>
            ) : (
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

                {error && (
                  <p className="text-sm text-error flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {getApiErrorMessage(error, 'Request failed')}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'Sending...' : 'Send reset link'}
                </Button>

                <div className="text-center mt-4">
                  <Link to="/login" className="text-sm text-accent hover:underline flex items-center justify-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Back to login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
