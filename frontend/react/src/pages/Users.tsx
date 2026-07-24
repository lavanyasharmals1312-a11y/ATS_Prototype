import { useState, useEffect } from 'react'
import { Plus, Shield, User as UserIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import { userService } from '@/services/userService'
import type { User, UserCreate } from '@/types'
import { getApiErrorMessage } from '@/lib/utils'

export default function Users() {
  const currentUser = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newUser, setNewUser] = useState<UserCreate>({ email: '', full_name: '', password: '', role: 'recruiter' })
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await userService.list()
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      await userService.create(newUser)
      setIsAdding(false)
      setNewUser({ email: '', full_name: '', password: '', role: 'recruiter' })
      loadUsers()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create user'))
    }
  }

  const toggleStatus = async (user: User) => {
    try {
      await userService.update(user.id, { is_active: !user.is_active })
      loadUsers()
    } catch (err) {
      console.error(err)
    }
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-text-3">You do not have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Team Management</h1>
          <p className="text-text-2">Manage recruiters and admins for ProEx Labs ATS.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      {isAdding && (
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input 
                    id="full_name" 
                    value={newUser.full_name}
                    onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select 
                    id="role"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-transparent px-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="recruiter" className="bg-surface text-text">Recruiter</option>
                    <option value="admin" className="bg-surface text-text">Admin</option>
                  </select>
                </div>
              </div>
              
              {error && <p className="text-sm text-error">{error}</p>}
              
              <div className="flex justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-surface">
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-sm text-text">
            <thead className="bg-surface-2 text-xs uppercase text-text-2">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-text">{u.full_name}</div>
                    <div className="text-xs text-text-3">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${u.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-surface-2 text-text-2'}`}>
                      {u.role === 'admin' ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${u.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleStatus(u)}
                      disabled={u.id === currentUser?.id}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr><td colSpan={4} className="p-4 text-center">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
