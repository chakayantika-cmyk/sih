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

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ── Fetch logs ────────────────────────────────────────────────────────────
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

  // ── Fetch users ───────────────────────────────────────────────────────────
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
    // Auto-refresh logs every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs, fetchUsers]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/');
  };

  // ── Add user ──────────────────────────────────────────────────────────────
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();

      if (res.ok) {
        setAddSuccess(`✅ "${newUser.name}" has been registered!`);
        setNewUser({ name: '', email: '' });
        fetchUsers();
        setTimeout(() => {
          setShowModal(false);
          setAddSuccess('');
        }, 1800);
      } else {
        setAddError(data.error || 'Failed to add user.');
      }
    } catch {
      setAddError('Network error. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setAddError('');
    setAddSuccess('');
    setNewUser({ name: '', email: '' });
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
              onClick={() => setShowModal(true)}
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

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Registered Users</p>
            <p className="text-4xl font-bold text-white mt-1">{users.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Total Logins</p>
            <p className="text-4xl font-bold text-white mt-1">{logs.length}</p>
          </div>
        </div>

        {/* ── Login Activity ── */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Login Activity</h2>
            <span className="text-xs text-gray-500">
              Refreshed {lastRefresh.toLocaleTimeString()} · auto every 5s
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="py-16 text-center text-gray-600">
              <p className="text-5xl mb-3">📋</p>
              <p className="text-sm">No login activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/60">
              {logs.map((log, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 text-sm">✓</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-semibold text-white">{log.username}</span>
                    <span className="text-gray-400"> logged-in at </span>
                    <span className="text-blue-400 font-medium">{log.time}</span>
                    <span className="text-gray-400"> </span>
                    <span className="text-gray-300">{log.date}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Add User Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Add New User</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                  placeholder="Enter user's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                  placeholder="Enter valid email address"
                  required
                />
              </div>

              {addError && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
                  ⚠️ {addError}
                </div>
              )}

              {addSuccess && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg px-4 py-3 text-green-300 text-sm">
                  {addSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? 'Adding…' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
