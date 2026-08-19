'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { setStoredToken, StaffPayload } from '@/lib/auth';
import {
  Coffee,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Store,
  KeyRound,
  UserPlus,
  LogIn,
  ChevronDown,
} from 'lucide-react';

interface AuthResponse {
  token: string;
  staff: StaffPayload;
}

interface OutletOption {
  id: number;
  name: string;
}

type AuthMode = 'login' | 'register';
type RoleOption = 'super_admin' | 'outlet_admin';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleOption>('outlet_admin');
  const [superadminCode, setSuperadminCode] = useState('');
  const [registerOutletId, setRegisterOutletId] = useState<number>(1);
  const [outlets, setOutlets] = useState<OutletOption[]>([
    { id: 1, name: 'ERCoffeeLab Bandung' },
    { id: 2, name: 'ERCoffeeLab Jakarta' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Outlets list for Outlet Admin registration
  useEffect(() => {
    apiFetch<{ data: OutletOption[] }>('/api/outlets')
      .then((res) => {
        let list: OutletOption[] = [];
        if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res)) list = res as any;
        if (list.length > 0) {
          setOutlets(list);
          setRegisterOutletId(list[0].id);
        }
      })
      .catch(() => {
        // Fallback static list
      });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'register' && !fullName)) {
      setError('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint =
        mode === 'login'
          ? '/api/auth/staff/login'
          : '/api/auth/staff/register';

      const payload =
        mode === 'login'
          ? { email, password }
          : {
              fullName,
              email,
              password,
              role,
              superadminCode: role === 'super_admin' ? superadminCode : undefined,
              outletId: role === 'outlet_admin' ? registerOutletId : null,
            };

      const data = await apiFetch<AuthResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // 1. Store token in localStorage
      setStoredToken(data.token);

      // 2. Set HttpOnly session cookie
      await fetch('/api/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token }),
      });

      // 3. Perform full document navigation to attach session cookie reliably
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(
        err?.message ||
          (mode === 'login'
            ? 'Masuk gagal. Periksa email dan kata sandi Anda.'
            : 'Pendaftaran gagal. Silakan periksa data Anda.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSSO = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    window.location.href = `${baseUrl}/api/auth/sso/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1230] p-4 relative overflow-hidden font-source">
      {/* Background Glow Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#C9A876]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#3B4B8C]/25 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 my-8">
        {/* Card Container */}
        <div className="bg-[#F6F3EC] p-8 rounded-3xl shadow-2xl border-2 border-[#C9A876]/40 backdrop-blur-xl">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="ER CoffeeLab"
              className="h-32 sm:h-36 w-auto max-w-[280px] mx-auto object-contain mb-4 filter drop-shadow-md"
            />
            <p className="text-xs text-[#6B7088] font-medium">
              Portal Operasional dan Manajemen Eksekutif
            </p>
          </div>
          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#E7E8F0] p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold font-albert transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#181F4B] text-[#C9A876] shadow-sm'
                  : 'text-[#6B7088] hover:text-[#181F4B]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold font-albert transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#181F4B] text-[#C9A876] shadow-sm'
                  : 'text-[#6B7088] hover:text-[#181F4B]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
          </div>

          <h2 className="text-lg font-bold font-albert text-[#181F4B] mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C9A876]" />
            {mode === 'login'
              ? 'Masuk ke Akun Staf'
              : 'Buat Akun Staf Baru'}
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-[#FDF0F2] border border-[#FAF1F3] flex items-start gap-3 text-xs text-[#C9576B]">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#C9576B] mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name field for register */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1.5 uppercase tracking-wider">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7088]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Budi Pratama"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#E7E8F0] rounded-xl text-sm text-[#1E202B] placeholder-[#A0A5BD] focus:outline-none focus:border-[#C9A876] focus:ring-2 focus:ring-[#C9A876]/20 transition shadow-xs"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#6B7088] mb-1.5 uppercase tracking-wider">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7088]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ercoffeelab.com"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#E7E8F0] rounded-xl text-sm text-[#1E202B] placeholder-[#A0A5BD] focus:outline-none focus:border-[#C9A876] focus:ring-2 focus:ring-[#C9A876]/20 transition shadow-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B7088] mb-1.5 uppercase tracking-wider">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7088]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#E7E8F0] rounded-xl text-sm text-[#1E202B] placeholder-[#A0A5BD] focus:outline-none focus:border-[#C9A876] focus:ring-2 focus:ring-[#C9A876]/20 transition shadow-xs"
                  required
                />
              </div>
            </div>

            {/* Additional Registration Fields */}
            {mode === 'register' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1.5 uppercase tracking-wider">
                    Daftar Sebagai Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('outlet_admin')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        role === 'outlet_admin'
                          ? 'bg-[#181F4B] border-[#181F4B] text-[#C9A876]'
                          : 'bg-white border-[#E7E8F0] text-[#1E202B] hover:border-[#C9A876]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs font-albert">
                        <Store className="w-3.5 h-3.5" />
                        <span>Outlet Admin</span>
                      </div>
                      <p className="text-[10px] opacity-80 mt-1">
                        Kelola 1 cabang outlet
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('super_admin')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        role === 'super_admin'
                          ? 'bg-[#181F4B] border-[#181F4B] text-[#C9A876]'
                          : 'bg-white border-[#E7E8F0] text-[#1E202B] hover:border-[#C9A876]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs font-albert">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Super Admin</span>
                      </div>
                      <p className="text-[10px] opacity-80 mt-1">
                        Akses penuh dan semua outlet
                      </p>
                    </button>
                  </div>
                </div>

                {role === 'outlet_admin' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#6B7088] mb-1.5 uppercase tracking-wider">
                      Pilih Cabang Outlet
                    </label>
                    <div className="relative">
                      <Store className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7088]" />
                      <select
                        value={registerOutletId}
                        onChange={(e) => setRegisterOutletId(Number(e.target.value))}
                        className="w-full pl-11 pr-8 py-3 bg-white border border-[#E7E8F0] rounded-xl text-sm text-[#1E202B] focus:outline-none focus:border-[#C9A876] appearance-none cursor-pointer shadow-xs font-semibold"
                        required
                      >
                        {outlets.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7088] pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-[#6B7088] mt-1">
                      * Akun Outlet Admin hanya dapat mengakses dan mengelola 1 cabang outlet ini.
                    </p>
                  </div>
                )}

                {role === 'super_admin' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#6B7088] mb-1.5 uppercase tracking-wider">
                      Kode Unik Super Admin
                    </label>
                    <div className="relative">
                      <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7088]" />
                      <input
                        type="text"
                        value={superadminCode}
                        onChange={(e) => setSuperadminCode(e.target.value)}
                        placeholder="ERLAB-SA-2025"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#E7E8F0] rounded-xl text-sm text-[#1E202B] placeholder-[#A0A5BD] focus:outline-none focus:border-[#C9A876] focus:ring-2 focus:ring-[#C9A876]/20 transition shadow-xs font-mono"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-[#6B7088] mt-1">
                      * Kode keamanan pendaftaran Super Admin: <code className="font-bold text-[#181F4B]">ERLAB-SA-2025</code>
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] font-bold rounded-xl text-sm transition font-albert flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02] active:scale-[0.98] mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#C9A876] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Masuk ke Dashboard'
                      : 'Daftar dan Masuk Sekarang'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#C9A876]" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E7E8F0]" />
            </div>
            <span className="relative bg-[#F6F3EC] px-3 text-xs font-medium text-[#6B7088] uppercase tracking-wider">
              atau masuk dengan
            </span>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleSSO}
            className="w-full py-3 px-4 bg-white hover:bg-[#F4F5F9] border border-[#E7E8F0] hover:border-[#C9A876] rounded-xl text-sm text-[#1E202B] transition flex items-center justify-center gap-3 font-semibold shadow-xs cursor-pointer hover:scale-[1.01]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#A0A5BD] mt-6">
          Hak Cipta 2026 ERCoffeeLab. Khusus akses operasional internal.
        </p>
      </div>
    </div>
  );
}
