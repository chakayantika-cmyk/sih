'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
      {/* Title */}
      <div className="text-center mb-14">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Security Portal</h1>
        <p className="text-gray-400 mt-2 text-base">Choose your access type to continue</p>
      </div>

      {/* Two main buttons */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* User */}
        <button
          onClick={() => router.push('/user/login')}
          className="
            flex flex-col items-center justify-center
            w-64 h-56
            bg-gray-800/80 border border-gray-700
            rounded-2xl
            hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20
            hover:-translate-y-1
            transition-all duration-300
          "
        >
          <span className="text-6xl mb-4">👤</span>
          <span className="text-xl font-semibold text-white">User Login</span>
          <span className="text-sm text-gray-400 mt-1">Login with OTP</span>
        </button>

        {/* Admin */}
        <button
          onClick={() => router.push('/admin/login')}
          className="
            flex flex-col items-center justify-center
            w-64 h-56
            bg-gray-800/80 border border-gray-700
            rounded-2xl
            hover:border-red-500 hover:shadow-xl hover:shadow-red-500/20
            hover:-translate-y-1
            transition-all duration-300
          "
        >
          <span className="text-6xl mb-4">🔐</span>
          <span className="text-xl font-semibold text-white">Admin Login</span>
          <span className="text-sm text-gray-400 mt-1">Credential-based access</span>
        </button>
      </div>
    </main>
  );
}
