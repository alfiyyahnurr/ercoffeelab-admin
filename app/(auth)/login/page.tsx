'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, AlertCircle } from 'lucide-react';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const error = searchParams.get('error');

  const handleGoogleSSO = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    window.location.href = `${baseUrl}/api/auth/sso/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1230] relative overflow-hidden font-source p-4">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#181F4B]/80 via-[#0E1230]/90 to-[#181F4B]/95" />

      {/* Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#C9A876]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#3B4B8C]/25 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card Container */}
      <div className="w-full max-w-md z-10 my-8">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl text-center border border-white/20 backdrop-blur-xl">
          {/* ERCoffeeLab Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="ER CoffeeLab"
              className="h-28 sm:h-32 w-auto max-w-[260px] object-contain filter drop-shadow-md"
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold font-albert text-[#181F4B] tracking-tight mb-2">
            Executive Dashboard
          </h1>

          {/* Subtitle Notice */}
          <p className="text-sm text-[#6B7088] leading-relaxed mb-6 max-w-xs mx-auto">
            Gunakan akun Google yang telah terdaftar untuk mengakses dashboard admin.
          </p>

          {/* Daily Expiration Notice Banner */}
          {reason === 'daily_cycle_expired' && (
            <div className="mb-6 p-4 rounded-2xl bg-[#FFF8EC] border border-[#F7E5C4] text-xs text-[#181F4B] flex items-start gap-3 text-left animate-in fade-in shadow-xs">
              <Clock className="w-5 h-5 text-[#C9A876] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#181F4B]">Sesi Harian Berakhir pada 00.00</p>
                <p className="text-[#6B7088] mt-0.5 leading-relaxed">
                  Sesi login Anda telah berakhir pada pergantian hari. Silakan masuk kembali menggunakan Google SSO.
                </p>
              </div>
            </div>
          )}

          {reason === 'session_expired' && (
            <div className="mb-6 p-4 rounded-2xl bg-[#FFF8EC] border border-[#F7E5C4] text-xs text-[#181F4B] flex items-start gap-3 text-left animate-in fade-in shadow-xs">
              <Clock className="w-5 h-5 text-[#C9A876] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#181F4B]">Sesi Login Berakhir</p>
                <p className="text-[#6B7088] mt-0.5 leading-relaxed">
                  Sesi Anda telah kedaluwarsa. Silakan masuk kembali.
                </p>
              </div>
            </div>
          )}

          {error === 'not_registered' && (
            <div className="mb-6 p-4 rounded-2xl bg-[#FDF0F2] border border-[#FAF1F3] text-xs text-[#C9576B] flex items-start gap-3 text-left animate-in fade-in shadow-xs">
              <AlertCircle className="w-5 h-5 text-[#C9576B] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#C9576B]">Akses Ditolak</p>
                <p className="mt-0.5 leading-relaxed">
                  Akun Google ini belum didaftarkan sebagai staf admin ERCoffeeLab.
                </p>
              </div>
            </div>
          )}

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleSSO}
            className="w-full py-3.5 px-6 bg-white hover:bg-[#F6F3EC] border-2 border-[#E7E8F0] hover:border-[#181F4B] rounded-2xl text-base text-[#181F4B] font-bold font-albert transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] mb-8"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9c-.6-.7-1-1.6-1-2.6z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.1C3.7 19.8 7.5 23 12 23z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          {/* Footer Terms */}
          <p className="text-xs text-[#6B7088] font-normal leading-relaxed">
            Dengan masuk, Anda menyetujui{' '}
            <span className="text-[#387663] font-semibold underline cursor-pointer hover:text-[#181F4B]">
              Syarat & Ketentuan
            </span>{' '}
            dan{' '}
            <span className="text-[#387663] font-semibold underline cursor-pointer hover:text-[#181F4B]">
              Kebijakan Privasi
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0E1230] p-4 font-source">
          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl text-center animate-pulse h-96 w-full max-w-md" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
