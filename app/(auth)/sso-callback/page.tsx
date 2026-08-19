'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setStoredToken } from '@/lib/auth';
import { Coffee, AlertCircle } from 'lucide-react';

function SSOCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const err = searchParams.get('error');

    if (err) {
      setError(err);
      return;
    }

    if (!token) {
      setError('Token SSO tidak ditemukan dalam URL callback');
      return;
    }

    const processSession = async () => {
      try {
        // 1. Store token in localStorage
        setStoredToken(token);

        // 2. Set HttpOnly cookie
        await fetch('/api/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        // 3. Redirect to dashboard
        router.push('/dashboard');
      } catch (e: any) {
        setError('Gagal memproses sesi SSO: ' + e.message);
      }
    };

    processSession();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="glass-dark p-8 rounded-2xl shadow-2xl border border-[#C9576B]/30 max-w-md w-full text-center">
        <AlertCircle className="w-12 h-12 text-[#C9576B] mx-auto mb-4" />
        <h2 className="text-lg font-bold font-albert text-white mb-2">Autentikasi SSO Gagal</h2>
        <p className="text-sm text-[#6B7088] mb-6">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-2.5 bg-[#C9A876] text-[#0E1230] font-semibold rounded-xl text-sm hover:bg-[#d4b382] transition"
        >
          Kembali ke Login
        </button>
      </div>
    );
  }

  return (
    <div className="glass-dark p-8 rounded-2xl shadow-2xl border border-[#C9A876]/20 max-w-md w-full text-center">
      <div className="w-12 h-12 border-3 border-[#C9A876] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <h2 className="text-lg font-bold font-albert text-white mb-2">Memproses Sesi Login...</h2>
      <p className="text-xs text-[#6B7088]">Mohon tunggu sebentar, Anda sedang dialihkan ke Dashboard.</p>
    </div>
  );
}

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1230] p-4 relative overflow-hidden font-source">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#C9A876]/10 rounded-full blur-[120px] pointer-events-none" />
      <Suspense
        fallback={
          <div className="glass-dark p-8 rounded-2xl border border-[#C9A876]/20 text-center text-white">
            <Coffee className="w-8 h-8 text-[#C9A876] animate-pulse mx-auto mb-2" />
            <p className="text-sm">Memuat callback...</p>
          </div>
        }
      >
        <SSOCallbackContent />
      </Suspense>
    </div>
  );
}
