'use client';

import { useRouter } from 'next/navigation';

export default function UserSuccess() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4 text-center">
      {/* Checkmark */}
      <div className="text-9xl mb-8 select-none animate-bounce">✅</div>

      {/* Success message – exactly as specified */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white uppercase tracking-widest leading-tight max-w-2xl">
        YOU&apos;VE SUCCESSFULLY LOGGED IN INTO OUR SITE
      </h1>

      <p className="text-gray-500 mt-6 text-sm">
        You are verified and logged in. Welcome aboard!
      </p>

      <button
        onClick={() => router.push('/')}
        className="mt-10 bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"
      >
        Return to Home
      </button>
    </main>
  );
}
