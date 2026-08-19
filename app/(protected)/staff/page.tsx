'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import Pagination from '@/components/Pagination';
import {
  Users,
  Plus,
  Pencil,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Store,
  KeyRound,
  CheckCircle2,
  XCircle,
  Info,
  Lock,
  Mail,
  User,
} from 'lucide-react';

interface StaffUser {
  id: number;
  email: string;
  fullName: string;
  role: 'super_admin' | 'outlet_admin';
  outletId?: number | null;
  outletName?: string | null;
  hasPassword?: boolean;
  isActive: boolean;
  createdAt: string;
}

interface OutletOption {
  id: number;
  name: string;
}

export default function StaffManagementPage() {
  const router = useRouter();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [outlets, setOutlets] = useState<OutletOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [staff, setStaff] = useState<StaffPayload | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

  // Form State
  const [formEmail, setFormEmail] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<'super_admin' | 'outlet_admin'>('outlet_admin');
  const [formOutletId, setFormOutletId] = useState<number>(1);
  const [formPassword, setFormPassword] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      const s = parseStaffToken(token);
      setStaff(s);
      if (s && s.role !== 'super_admin') {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const fetchOutlets = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: OutletOption[] }>('/api/outlets');
      if (Array.isArray(res?.data) && res.data.length > 0) {
        setOutlets(res.data);
        setFormOutletId(res.data[0].id);
      }
    } catch {
      setOutlets([
        { id: 1, name: 'ERCoffeeLab Bandung' },
        { id: 2, name: 'ERCoffeeLab Jakarta' },
      ]);
    }
  }, []);

  const fetchStaffUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: StaffUser[] }>('/api/staff-users');
      if (Array.isArray(res?.data)) {
        setStaffUsers(res.data);
      } else if (Array.isArray(res)) {
        setStaffUsers(res as any);
      } else {
        setStaffUsers([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar akun staf');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutlets();
    fetchStaffUsers();
  }, [fetchOutlets, fetchStaffUsers]);

  const openAddModal = () => {
    setEditingStaff(null);
    setFormEmail('');
    setFormFullName('');
    setFormRole('outlet_admin');
    if (outlets.length > 0) setFormOutletId(outlets[0].id);
    setFormPassword('');
    setFormIsActive(true);
    setError(null);
    setInfoMessage(null);
    setModalOpen(true);
  };

  const openEditModal = (su: StaffUser) => {
    setEditingStaff(su);
    setFormEmail(su.email);
    setFormFullName(su.fullName);
    setFormRole(su.role);
    setFormOutletId(su.outletId || (outlets[0]?.id ?? 1));
    setFormPassword('');
    setFormIsActive(su.isActive);
    setError(null);
    setInfoMessage(null);
    setModalOpen(true);
  };

  const handleToggleActive = async (su: StaffUser) => {
    setUpdatingId(su.id);
    setError(null);
    setInfoMessage(null);
    const nextActive = !su.isActive;

    try {
      await apiFetch(`/api/staff-users/${su.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextActive }),
      });

      setStaffUsers((prev) =>
        prev.map((item) => (item.id === su.id ? { ...item, isActive: nextActive } : item))
      );
      setInfoMessage(
        `Status akun "${su.fullName}" diubah menjadi ${
          nextActive ? 'AKTIF' : 'NONAKTIF'
        }.`
      );
    } catch (err: any) {
      setError(err?.message || 'Gagal mengubah status akun staf');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveStaff = async (e: FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim() || !formFullName.trim()) {
      setError('Email dan Nama Lengkap staf wajib diisi');
      return;
    }

    if (editingStaff) {
      const isUnchanged =
        formEmail.trim().toLowerCase() === editingStaff.email &&
        formFullName.trim() === editingStaff.fullName &&
        formRole === editingStaff.role &&
        (formRole === 'super_admin' ? null : formOutletId) === (editingStaff.outletId ?? null) &&
        !formPassword &&
        formIsActive === editingStaff.isActive;

      if (isUnchanged) {
        setInfoMessage('Tidak ada perubahan yang disimpan.');
        setModalOpen(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const payload: any = {
      email: formEmail.trim().toLowerCase(),
      fullName: formFullName.trim(),
      role: formRole,
      outletId: formRole === 'super_admin' ? null : formOutletId,
      isActive: formIsActive,
    };

    if (formPassword.trim()) {
      payload.password = formPassword.trim();
    }

    try {
      if (editingStaff) {
        await apiFetch(`/api/staff-users/${editingStaff.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Akun staf "${formFullName.trim()}" berhasil diperbarui.`);
      } else {
        await apiFetch('/api/staff-users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Akun staf baru "${formFullName.trim()}" berhasil ditambahkan.`);
      }

      setModalOpen(false);
      await fetchStaffUsers();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan akun staf');
    } finally {
      setLoading(false);
    }
  };

  const filteredStaffUsers = staffUsers.filter((su) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      su.fullName.toLowerCase().includes(q) ||
      su.email.toLowerCase().includes(q) ||
      (su.outletName && su.outletName.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredStaffUsers.length / itemsPerPage));
  const paginatedStaff = filteredStaffUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (staff && staff.role !== 'super_admin') {
    return (
      <div className="py-24 text-center space-y-4 font-source max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-[#C9576B] mx-auto" />
        <h2 className="text-lg font-bold font-albert text-[#181F4B]">Akses Dibatasi</h2>
        <p className="text-xs text-[#6B7088]">
          Halaman Manajemen Akun Staf hanya dapat diakses oleh Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-source">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-albert text-[#181F4B] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#C9A876]" />
            Staff Accounts Management
          </h1>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Kelola pengguna internal sistem (Super Admin & Outlet Admin), penetapan cabang outlet, dan metode autentikasi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStaffUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F6F3EC] border border-[#E7E8F0] hover:border-[#C9A876] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C9A876] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] rounded-xl text-xs font-bold font-albert transition-all duration-150 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Staf Baru</span>
          </button>
        </div>
      </div>

      {infoMessage && (
        <div className="p-4 rounded-2xl bg-[#FEF6E6] border border-[#F7E5C4] text-xs text-[#181F4B] flex items-center justify-between gap-3 font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#C9A876] shrink-0" />
            <span>{infoMessage}</span>
          </div>
          <button
            onClick={() => setInfoMessage(null)}
            className="p-1 text-[#6B7088] hover:text-[#181F4B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#FDF0F2] border border-[#FAF1F3] text-xs text-[#C9576B] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E8F0] shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7088]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama staf, email, atau cabang outlet..."
            className="w-full pl-9 pr-4 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] placeholder-[#6B7088] focus:outline-none focus:border-[#C9A876] transition"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F6F3EC] border-b border-[#E7E8F0] text-[#6B7088] uppercase tracking-wider font-bold font-albert text-[11px]">
                <th className="py-3.5 px-4">Nama Staf & Email</th>
                <th className="py-3.5 px-4">Role Hak Akses</th>
                <th className="py-3.5 px-4">Cabang Outlet Assignment</th>
                <th className="py-3.5 px-4 text-center">Autentikasi</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B7088]">
                    <div className="w-6 h-6 border-2 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat akun staf...</span>
                  </td>
                </tr>
              ) : paginatedStaff.length > 0 ? (
                paginatedStaff.map((su) => {
                  const isUpdating = updatingId === su.id;

                  return (
                    <tr key={su.id} className="hover:bg-[#F4F5F9] transition">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-[#181F4B] font-albert text-sm">
                            {su.fullName}
                          </p>
                          <p className="text-xs text-[#6B7088] font-mono">
                            {su.email}
                          </p>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {su.role === 'super_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#181F4B] text-[#C9A876] uppercase tracking-wider shadow-2xs">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#EDF0FA] text-[#3B4B8C] uppercase tracking-wider">
                            <Store className="w-3.5 h-3.5" />
                            Outlet Admin
                          </span>
                        )}
                      </td>

                      {/* Outlet Assignment */}
                      <td className="py-3.5 px-4 text-[#6B7088]">
                        {su.role === 'super_admin' ? (
                          <span className="text-[11px] font-semibold text-[#C9A876] bg-[#FEF6E6] px-2 py-0.5 rounded border border-[#F7E5C4]">
                            Semua Outlet (Global)
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-[#181F4B]">
                            {su.outletName || `Outlet #${su.outletId}`}
                          </span>
                        )}
                      </td>

                      {/* Auth Type */}
                      <td className="py-3.5 px-4 text-center">
                        {su.hasPassword ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6B7088] bg-[#F4F5F9] px-2.5 py-1 rounded-full border border-[#E7E8F0]" title="Login Password Active">
                            <Lock className="w-3 h-3 text-[#181F4B]" />
                            Password Set
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3B4B8C] bg-[#EDF0FA] px-2.5 py-1 rounded-full border border-[#D2D9F3]" title="Google SSO Only">
                            <KeyRound className="w-3 h-3 text-[#3B4B8C]" />
                            SSO Only
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(su)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95 ${
                            su.isActive
                              ? 'bg-[#EAF5EE] text-[#3E8A5A] border border-[#C6E7D2] hover:bg-[#d8eedf]'
                              : 'bg-[#FDF0F2] text-[#C9576B] border border-[#FAF1F3] hover:bg-[#fae2e6]'
                          }`}
                        >
                          {su.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>AKTIF</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>NONAKTIF</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => openEditModal(su)}
                          className="p-1.5 rounded-lg bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-transparent text-[#181F4B] transition cursor-pointer hover:scale-105"
                          title="Edit Akun Staf"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#6B7088]">
                    <Users className="w-8 h-8 text-[#E7E8F0] mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#1E202B]">Belum ada akun staf</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredStaffUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(num) => {
            setItemsPerPage(num);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Add / Edit Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#E7E8F0] animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E7E8F0] pb-3">
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                {editingStaff ? 'Edit Akun Staf' : 'Tambah Akun Staf Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#6B7088] hover:text-[#181F4B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Nama Lengkap Staf
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7088]" />
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Budi Pratama"
                    className="w-full pl-9 pr-3 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none focus:border-[#C9A876]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Alamat Email Staf
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7088]" />
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="staff@ercoffeelab.com"
                    className="w-full pl-9 pr-3 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none focus:border-[#C9A876]"
                    required
                    disabled={Boolean(editingStaff)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Role Hak Akses
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole('outlet_admin')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      formRole === 'outlet_admin'
                        ? 'bg-[#181F4B] border-[#181F4B] text-[#C9A876]'
                        : 'bg-white border-[#E7E8F0] text-[#1E202B] hover:border-[#C9A876]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs font-albert">
                      <Store className="w-3.5 h-3.5" />
                      <span>Outlet Admin</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('super_admin')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      formRole === 'super_admin'
                        ? 'bg-[#181F4B] border-[#181F4B] text-[#C9A876]'
                        : 'bg-white border-[#E7E8F0] text-[#1E202B] hover:border-[#C9A876]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs font-albert">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Super Admin</span>
                    </div>
                  </button>
                </div>
              </div>

              {formRole === 'outlet_admin' && (
                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Pilih Cabang Outlet Assignment
                  </label>
                  <select
                    value={formOutletId}
                    onChange={(e) => setFormOutletId(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none cursor-pointer font-semibold"
                    required
                  >
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  {editingStaff ? 'Reset Password (Opsional)' : 'Password Akun (Opsional)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7088]" />
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingStaff ? 'Kosongkan jika tidak diubah' : 'Kosongkan untuk SSO Only'}
                    className="w-full pl-9 pr-3 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none focus:border-[#C9A876]"
                  />
                </div>
                <p className="text-[10px] text-[#6B7088] mt-1">
                  * Jika dikosongkan, staf hanya dapat login menggunakan Google SSO.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#C9A876] rounded cursor-pointer"
                />
                <label htmlFor="formIsActive" className="text-xs font-semibold text-[#181F4B] cursor-pointer">
                  Akun staf aktif & dapat beroperasi
                </label>
              </div>

              <div className="pt-4 border-t border-[#E7E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-[#F4F5F9] hover:bg-[#E7E8F0] text-[#6B7088] font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] font-bold text-xs rounded-xl transition shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
