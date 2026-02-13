import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../services/api'
import BackButton from '../components/ui/BackButton'

interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'estimator' | 'viewer'
  is_witness: boolean
  is_active: boolean
  created_at: string
  last_login: string | null
}

export default function UserManagementAdminPage() {
  const queryClient = useQueryClient()
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedActive, setSelectedActive] = useState<boolean>(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/auth/users'),
  })

  const users = usersData?.data?.users || []

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id)
    setSelectedRole(user.role)
    setSelectedActive(user.is_active)
    setError('')
  }

  const handleSaveUser = async (userId: number) => {
    try {
      setError('')
      await api.put(`/auth/users/${userId}`, {
        role: selectedRole,
        is_active: selectedActive,
      })

      setSuccess('User updated successfully')
      setEditingUserId(null)
      refetch()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setDeleting(userId)
    try {
      setError('')
      await api.delete(`/auth/users/${userId}`)
      setSuccess('User deleted successfully')
      refetch()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-khc-primary">User Management</h1>
        <p className="text-gray-600 mt-2">Manage user accounts, roles, and permissions</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">User</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Last Login</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user: User) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      {editingUserId === user.id ? (
                        <select
                          value={selectedRole}
                          onChange={e => setSelectedRole(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khc-primary"
                        >
                          <option value="admin">Admin</option>
                          <option value="estimator">Estimator</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'estimator'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingUserId === user.id ? (
                        <select
                          value={selectedActive ? '1' : '0'}
                          onChange={e => setSelectedActive(e.target.value === '1')}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khc-primary"
                        >
                          <option value="1">Active</option>
                          <option value="0">Inactive</option>
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {editingUserId === user.id ? (
                        <>
                          <button
                            onClick={() => handleSaveUser(user.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-3 py-1 bg-khc-primary text-white rounded-lg hover:bg-khc-primary/90 transition-colors text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleting === user.id}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                          >
                            {deleting === user.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-khc-primary">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Admins</p>
          <p className="text-3xl font-bold text-purple-600">{users.filter((u: User) => u.role === 'admin').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Active Users</p>
          <p className="text-3xl font-bold text-green-600">{users.filter((u: User) => u.is_active).length}</p>
        </div>
      </div>
    </div>
  )
}
