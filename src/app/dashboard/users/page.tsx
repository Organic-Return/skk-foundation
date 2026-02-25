'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

interface DashboardUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
  sanity_team_member_id: string | null;
  created_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Add user form
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'agent' | 'admin'>('agent');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  // Temp password display
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState('');
  const [copied, setCopied] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Auth check
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.push('/dashboard/login');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/dashboard/login');
      } else {
        setToken(session.access_token);
      }
    });
  }, [router]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetch('/api/dashboard/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        router.push('/dashboard');
        return;
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setCreating(true);
    setFormError('');

    try {
      const res = await fetch('/api/dashboard/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail, name: newName, role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to create user');
        return;
      }

      setTempPassword(data.tempPassword);
      setTempEmail(data.user.email);
      setNewEmail('');
      setNewName('');
      setNewRole('agent');
      setShowForm(false);
      fetchUsers();
    } catch {
      setFormError('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!token) return;
    setDeleteError('');

    try {
      const res = await fetch(`/api/dashboard/users?userId=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete user');
        return;
      }

      setDeletingId(null);
      fetchUsers();
    } catch {
      setDeleteError('Network error');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manage Users</h1>
          <p className="text-gray-500 text-sm mt-1">
            {users.length} dashboard user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Back to Leads
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setFormError(''); }}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancel' : 'Add User'}
          </button>
        </div>
      </div>

      {/* Temp password alert */}
      {tempPassword && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800 mb-2">
            User created successfully! Share these credentials with {tempEmail}:
          </p>
          <div className="flex items-center gap-3 bg-white border border-green-300 rounded px-3 py-2">
            <code className="text-sm text-gray-800 flex-1">
              Email: {tempEmail} &nbsp;|&nbsp; Password: {tempPassword}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`Email: ${tempEmail}\nPassword: ${tempPassword}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3 py-1 text-xs font-medium text-green-700 border border-green-300 rounded hover:bg-green-50"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => { setTempPassword(null); setTempEmail(''); }}
            className="mt-2 text-xs text-green-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add User Form */}
      {showForm && (
        <div className="mb-6 p-5 bg-white shadow rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New User</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'agent' | 'admin')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
            {formError && (
              <p className="sm:col-span-2 text-sm text-red-600">{formError}</p>
            )}
          </form>
          <p className="text-xs text-gray-400 mt-3">A temporary password will be generated automatically. Share it with the user so they can log in.</p>
        </div>
      )}

      {/* Delete error */}
      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {deleteError}
          <button onClick={() => setDeleteError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading users...</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {deletingId === user.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-red-600">Delete this user?</span>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeletingId(user.id)}
                        className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
