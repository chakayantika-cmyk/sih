'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface LogEntry {
  username: string;
  email: string;
  time: string;
  date: string;
}

interface User {
  name: string;
  email: string;
}

export default function AdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'logs' | 'users'>('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form states
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [editUser, setEditUser] = useState({ name: '', email: '' });
  
  // Loading & Error states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/admin/logs');
    if (res.status === 401) {
      router.push('/admin/login');
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs ?? []);
      setLastRefresh(new Date());
    }
  }, [router]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchUsers();
    // Only auto-poll logs when the logs tab is active to reduce flicker
    const interval = setInterval(() => {
      fetchLogs();
      fetchUsers();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs, fetchUsers]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`✅ "${newUser.name}" added successfully!`);
        fetchUsers();
        setTimeout(() => closeModals(), 1500);
      } else {
        setErrorMsg(data.error || 'Failed to add user.');
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editUser.email, newName: editUser.name }),
      });
      
      if (res.ok) {
        setSuccessMsg('✅ User updated successfully!');
        fetchUsers();
        setTimeout(() => closeModals(), 1500);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to update user.');
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email}?`)) return;
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Failed to delete user.');
      }
    } catch {
      alert('Network error.');
    }
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setErrorMsg('');
    setSuccessMsg('');
    setNewUser({ name: '', email: '' });
  };

  const openEditModal = (user: User) => {
    setEditUser({ name: user.name, email: user.email });
    setShowEditModal(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* ── Header ── */}
      <header className="border-b border-gray-800 bg-gray-900/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔐</span>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Admin Dashboard</h1>
              <p className="text-xs text-gray-500 mt-0.5">Logged in as adminSIH</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Add User
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'logs' 
                ? 'border-b-2 border-blue-500 text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Login Activity
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 text-sm font-medium transition-colors flex gap-2 items-center ${
              activeTab === 'users' 
                ? 'border-b-2 border-blue-500 text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Registered Users
            <span className="bg-gray-800 text-xs py-0.5 px-2 rounded-full border border-gray-700">
              {users.length}
            </span>
          </button>
        </div>

        {/* ── Tab: Login Activity ── */}
        {activeTab === 'logs' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Recent Logins</h2>
              <span className="text-xs text-gray-500">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>

            {logs.length === 0 ? (
              <div className="py-16 text-center text-gray-600">
                <p className="text-5xl mb-3">📋</p>
                <p className="text-sm">No login activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/60 max-h-[600px] overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-900/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-400 text-sm">✓</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold text-white">{log.username}</span>
                      <span className="text-gray-400"> ({log.email}) logged-in at </span>
                      <span className="text-blue-400 font-medium">{log.time}</span>
                      <span className="text-gray-400"> </span>
                      <span className="text-gray-300">{log.date}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Registered Users ── */}
        {activeTab === 'users' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Manage Users</h2>
            </div>
            
            {users.length === 0 ? (
              <div className="py-16 text-center text-gray-600">
                <p className="text-5xl mb-3">👥</p>
                <p className="text-sm">No registered users</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-900/50 text-gray-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Registered Name</th>
                      <th className="px-6 py-4 font-medium">Registered Email</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/60">
                    {users.map((user, i) => (
                      <tr key={i} className="hover:bg-gray-700/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                        <td className="px-6 py-4 text-gray-400">{user.email}</td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button 
                            onClick={() => openEditModal(user)}
                            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.email)}
                            className="text-red-400 hover:text-red-300 font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && closeModals()}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-6">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 transition-colors"
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 transition-colors"
                  placeholder="Enter email"
                  required
                />
              </div>
              {errorMsg && <div className="text-red-400 text-sm mt-2">{errorMsg}</div>}
              {successMsg && <div className="text-green-400 text-sm mt-2">{successMsg}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModals} className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">{loading ? 'Saving...' : 'Add User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && closeModals()}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-6">Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email (Read Only)</label>
                <input
                  type="email"
                  value={editUser.email}
                  disabled
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 transition-colors"
                  required
                />
              </div>
              {errorMsg && <div className="text-red-400 text-sm mt-2">{errorMsg}</div>}
              {successMsg && <div className="text-green-400 text-sm mt-2">{successMsg}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModals} className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
