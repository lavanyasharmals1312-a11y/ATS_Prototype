import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, Shield, UserIcon, X, AlertCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuthStore } from '@/store/authStore'
import { userService } from '@/services/userService'
import { getApiErrorMessage, cn } from '@/lib/utils'
import type { UserCreate } from '@/types'

const EMPTY_FORM: UserCreate = {
  email: '',
  full_name: '',
  password: '',
  role: 'recruiter',
}

export default function Users() {
  const shouldReduceMotion = useReducedMotion()
  const currentUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [newUser, setNewUser] = useState<UserCreate>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.list,
    enabled: currentUser?.role === 'admin',
  })

  const createMutation = useMutation({
    mutationFn: (data: UserCreate) => userService.create(data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(`${user.full_name} added successfully`)
      setShowForm(false)
      setNewUser(EMPTY_FORM)
      setFormError(null)
    },
    onError: (err: unknown) => {
      setFormError(getApiErrorMessage(err, 'Failed to create user'))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.update(id, { is_active: isActive }),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(`${user.full_name} ${user.is_active ? 'activated' : 'deactivated'}`)
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Failed to update user'))
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!newUser.full_name || !newUser.email || !newUser.password) {
      setFormError('All fields are required')
      return
    }
    createMutation.mutate(newUser)
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-sm text-text-3">You do not have permission to view this page.</p>
      </div>
    )
  }

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <PageHeader
        title="Team"
        description="Manage recruiters and administrators"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setShowForm((v) => !v)
              setFormError(null)
              setNewUser(EMPTY_FORM)
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Add Member
          </Button>
        }
      />

      {/* Add User Form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <SectionHeader title="New Team Member" className="mb-0 border-0 pb-0" />
            <button
              onClick={() => setShowForm(false)}
              className="text-text-3 hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
              aria-label="Close form"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new_full_name" className="text-xs text-text-2">Full Name</Label>
                <Input
                  id="new_full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new_email" className="text-xs text-text-2">Email</Label>
                <Input
                  id="new_email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="jane@proexlabs.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new_password" className="text-xs text-text-2">Temporary Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new_role" className="text-xs text-text-2">Role</Label>
                <select
                  id="new_role"
                  className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="recruiter" className="bg-surface text-text">Recruiter</option>
                  <option value="admin" className="bg-surface text-text">Admin</option>
                </select>
              </div>
            </div>

            {formError && (
              <p className="flex items-center gap-1.5 text-xs text-error" role="alert">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {formError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Member'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Team members">
            <thead>
              <tr className="border-b border-border bg-surface-2/60">
                <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3">
                  Member
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3">
                  Role
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-text-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-7 w-7 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-3 w-36" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Skeleton className="ml-auto h-7 w-20 rounded-md" />
                      </td>
                    </tr>
                  ))
                : users && users.length > 0
                  ? users.map((u) => (
                      <tr
                        key={u.id}
                        className={cn(
                          'transition-colors hover:bg-surface-2',
                          !u.is_active && 'opacity-60',
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold text-text-2"
                              aria-hidden="true"
                            >
                              {getInitials(u.full_name)}
                            </div>
                            <div>
                              <p
                                className={cn(
                                  'text-sm font-medium text-text',
                                  !u.is_active && 'line-through text-text-4',
                                )}
                              >
                                {u.full_name}
                                {u.id === currentUser?.id && (
                                  <span className="ml-1.5 text-[10px] font-normal text-text-3">
                                    (you)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-text-3">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium',
                              u.role === 'admin'
                                ? 'bg-accent/10 text-accent'
                                : 'bg-surface-2 text-text-2',
                            )}
                          >
                            {u.role === 'admin' ? (
                              <Shield className="h-3 w-3" aria-hidden="true" />
                            ) : (
                              <UserIcon className="h-3 w-3" aria-hidden="true" />
                            )}
                            {u.role === 'admin' ? 'Admin' : 'Recruiter'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-xs font-medium',
                              u.is_active ? 'text-success' : 'text-text-4',
                            )}
                          >
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleMutation.mutate({ id: u.id, isActive: !u.is_active })
                            }
                            disabled={
                              u.id === currentUser?.id || toggleMutation.isPending
                            }
                            className="text-xs"
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  : null}
              {!isLoading && (!users || users.length === 0) && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={UserIcon}
                      title="No team members"
                      description="Add your first team member using the button above."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
