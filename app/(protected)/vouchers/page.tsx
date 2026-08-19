'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import Pagination from '@/components/Pagination';
import {
  Ticket,
  Plus,
  Pencil,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  XCircle,
  Info,
  Copy,
  Check,
  Percent,
  Coins,
} from 'lucide-react';

interface VoucherItem {
  id: number;
  name?: string | null;
  description?: string | null;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxDiscount?: number | null;
  minPurchase?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  usageLimit?: number | null;
  usedCount?: number | null;
  isActive: boolean;
}

export default function VouchersPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [staff, setStaff] = useState<StaffPayload | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<'percent' | 'fixed'>('percent');
  const [formValue, setFormValue] = useState('');
  const [formMaxDiscount, setFormMaxDiscount] = useState('');
  const [formMinPurchase, setFormMinPurchase] = useState('');
  const [formValidFrom, setFormValidFrom] = useState('');
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState('');
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

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: VoucherItem[] }>('/api/vouchers');
      if (Array.isArray(res?.data)) {
        setVouchers(res.data);
      } else if (Array.isArray(res)) {
        setVouchers(res as any);
      } else {
        setVouchers([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar voucher promo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const openAddModal = () => {
    setEditingVoucher(null);
    setFormCode('');
    setFormName('');
    setFormDesc('');
    setFormType('percent');
    setFormValue('20');
    setFormMaxDiscount('15000');
    setFormMinPurchase('50000');
    setFormValidFrom('');
    setFormValidUntil('');
    setFormUsageLimit('100');
    setFormIsActive(true);
    setError(null);
    setInfoMessage(null);
    setModalOpen(true);
  };

  const openEditModal = (v: VoucherItem) => {
    setEditingVoucher(v);
    setFormCode(v.code);
    setFormName(v.name || '');
    setFormDesc(v.description || '');
    setFormType(v.discountType);
    setFormValue(String(v.discountValue));
    setFormMaxDiscount(v.maxDiscount ? String(v.maxDiscount) : '');
    setFormMinPurchase(v.minPurchase ? String(v.minPurchase) : '0');
    setFormValidFrom(v.validFrom ? new Date(v.validFrom).toISOString().slice(0, 16) : '');
    setFormValidUntil(v.validUntil ? new Date(v.validUntil).toISOString().slice(0, 16) : '');
    setFormUsageLimit(v.usageLimit ? String(v.usageLimit) : '');
    setFormIsActive(v.isActive);
    setError(null);
    setInfoMessage(null);
    setModalOpen(true);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (v: VoucherItem) => {
    setUpdatingId(v.id);
    setError(null);
    setInfoMessage(null);
    const nextActive = !v.isActive;

    try {
      await apiFetch(`/api/vouchers/${v.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextActive }),
      });

      setVouchers((prev) =>
        prev.map((item) => (item.id === v.id ? { ...item, isActive: nextActive } : item))
      );
      setInfoMessage(
        `Status kampanye promo "${v.code}" diubah menjadi ${
          nextActive ? 'AKTIF' : 'NONAKTIF'
        }.`
      );
    } catch (err: any) {
      setError(err?.message || 'Gagal mengubah status voucher');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveVoucher = async (e: FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formValue) {
      setError('Kode promo dan nilai diskon wajib diisi');
      return;
    }

    const codeUpper = formCode.trim().toUpperCase();

    // Check no changes
    if (editingVoucher) {
      const isUnchanged =
        codeUpper === editingVoucher.code &&
        (formName.trim() || null) === (editingVoucher.name || null) &&
        (formDesc.trim() || null) === (editingVoucher.description || null) &&
        formType === editingVoucher.discountType &&
        Number(formValue) === editingVoucher.discountValue &&
        (formMaxDiscount ? Number(formMaxDiscount) : null) === (editingVoucher.maxDiscount ?? null) &&
        (formMinPurchase ? Number(formMinPurchase) : 0) === (editingVoucher.minPurchase ?? 0) &&
        (formValidFrom ? new Date(formValidFrom).toISOString() : null) === (editingVoucher.validFrom ? new Date(editingVoucher.validFrom).toISOString() : null) &&
        (formValidUntil ? new Date(formValidUntil).toISOString() : null) === (editingVoucher.validUntil ? new Date(editingVoucher.validUntil).toISOString() : null) &&
        (formUsageLimit ? Number(formUsageLimit) : null) === (editingVoucher.usageLimit ?? null) &&
        formIsActive === editingVoucher.isActive;

      if (isUnchanged) {
        setInfoMessage('Tidak ada perubahan yang disimpan.');
        setModalOpen(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    const payload = {
      code: codeUpper,
      name: formName.trim() || null,
      description: formDesc.trim() || null,
      discountType: formType,
      discountValue: Number(formValue),
      maxDiscount: formMaxDiscount ? Number(formMaxDiscount) : null,
      minPurchase: formMinPurchase ? Number(formMinPurchase) : 0,
      validFrom: formValidFrom ? new Date(formValidFrom).toISOString() : null,
      validUntil: formValidUntil ? new Date(formValidUntil).toISOString() : null,
      usageLimit: formUsageLimit ? Number(formUsageLimit) : null,
      isActive: formIsActive,
    };

    try {
      if (editingVoucher) {
        await apiFetch(`/api/vouchers/${editingVoucher.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Voucher promo "${codeUpper}" berhasil diperbarui.`);
      } else {
        await apiFetch('/api/vouchers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Voucher promo baru "${codeUpper}" berhasil dibuat.`);
      }

      setModalOpen(false);
      await fetchVouchers();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan voucher promo. Periksa kode promo.');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val?: number | null) =>
    val !== undefined && val !== null
      ? 'Rp' + Math.max(0, Math.round(val)).toLocaleString('id-ID')
      : '-';

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Tidak Terbatas';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredVouchers = vouchers.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      v.code.toLowerCase().includes(q) ||
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.description && v.description.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / itemsPerPage));
  const paginatedVouchers = filteredVouchers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (staff && staff.role !== 'super_admin') {
    return (
      <div className="py-24 text-center space-y-4 font-source max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-[#C9576B] mx-auto" />
        <h2 className="text-lg font-bold font-albert text-[#181F4B]">Akses Dibatasi</h2>
        <p className="text-xs text-[#6B7088]">
          Halaman Vouchers & Promo Campaign hanya dapat diakses oleh Super Admin.
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
            <Ticket className="w-6 h-6 text-[#C9A876]" />
            Vouchers & Promo Campaign
          </h1>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Kelola kode diskon promo, batas kuota penggunaan, nominal diskon, dan masa berlaku kampanye.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVouchers}
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
            <span>Buat Voucher Baru</span>
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode promo atau nama voucher..."
            className="w-full pl-9 pr-4 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] placeholder-[#6B7088] focus:outline-none focus:border-[#C9A876] transition"
          />
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F6F3EC] border-b border-[#E7E8F0] text-[#6B7088] uppercase tracking-wider font-bold font-albert text-[11px]">
                <th className="py-3.5 px-4">Kode Promo & Nama</th>
                <th className="py-3.5 px-4">Nilai Diskon</th>
                <th className="py-3.5 px-4">Syarat & Max Diskon</th>
                <th className="py-3.5 px-4">Masa Berlaku</th>
                <th className="py-3.5 px-4 text-center">Penggunaan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B7088]">
                    <div className="w-6 h-6 border-2 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat voucher promo...</span>
                  </td>
                </tr>
              ) : paginatedVouchers.length > 0 ? (
                paginatedVouchers.map((voucher) => {
                  const isUpdating = updatingId === voucher.id;

                  return (
                    <tr key={voucher.id} className="hover:bg-[#F4F5F9] transition">
                      {/* Code & Name */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-[#181F4B] text-[#C9A876] px-2.5 py-1 rounded-lg tracking-wider uppercase inline-flex items-center gap-1 shadow-2xs">
                              {voucher.code}
                              <button
                                onClick={() => handleCopyCode(voucher.code)}
                                className="text-[#C9A876] hover:text-white transition p-0.5 cursor-pointer"
                                title="Copy Code"
                              >
                                {copiedCode === voucher.code ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                          </div>
                          {voucher.name && (
                            <p className="font-bold text-[#181F4B] font-albert">
                              {voucher.name}
                            </p>
                          )}
                          {voucher.description && (
                            <p className="text-[11px] text-[#6B7088] line-clamp-1">
                              {voucher.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4 font-bold font-albert text-[#181F4B]">
                        {voucher.discountType === 'percent' ? (
                          <span className="inline-flex items-center gap-1 text-[#3B4B8C] bg-[#EDF0FA] px-2.5 py-1 rounded-lg">
                            <Percent className="w-3.5 h-3.5" />
                            {voucher.discountValue}% OFF
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#C9A876] bg-[#FEF6E6] px-2.5 py-1 rounded-lg">
                            <Coins className="w-3.5 h-3.5" />
                            Potongan {formatRupiah(voucher.discountValue)}
                          </span>
                        )}
                      </td>

                      {/* Min Purchase & Max Discount */}
                      <td className="py-3.5 px-4 text-[#6B7088] space-y-0.5 text-[11px]">
                        <div>
                          Min. Belanja:{' '}
                          <strong className="text-[#181F4B]">
                            {formatRupiah(voucher.minPurchase)}
                          </strong>
                        </div>
                        {voucher.maxDiscount && (
                          <div>
                            Max. Diskon:{' '}
                            <strong className="text-[#181F4B]">
                              {formatRupiah(voucher.maxDiscount)}
                            </strong>
                          </div>
                        )}
                      </td>

                      {/* Validity Period */}
                      <td className="py-3.5 px-4 text-[#6B7088] text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#C9A876]" />
                          <span>
                            {formatDate(voucher.validFrom)} - {formatDate(voucher.validUntil)}
                          </span>
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-[#181F4B] font-albert">
                          {voucher.usedCount || 0}
                        </span>
                        <span className="text-[#6B7088] text-[11px]">
                          {' '}
                          / {voucher.usageLimit ? voucher.usageLimit : '∞'}
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(voucher)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95 ${
                            voucher.isActive
                              ? 'bg-[#EAF5EE] text-[#3E8A5A] border border-[#C6E7D2] hover:bg-[#d8eedf]'
                              : 'bg-[#FDF0F2] text-[#C9576B] border border-[#FAF1F3] hover:bg-[#fae2e6]'
                          }`}
                        >
                          {voucher.isActive ? (
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
                          onClick={() => openEditModal(voucher)}
                          className="p-1.5 rounded-lg bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-transparent text-[#181F4B] transition cursor-pointer hover:scale-105"
                          title="Edit Voucher"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#6B7088]">
                    <Ticket className="w-8 h-8 text-[#E7E8F0] mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#1E202B]">Belum ada voucher promo</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Pagination matching reference image */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredVouchers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(num) => {
            setItemsPerPage(num);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Add / Edit Voucher Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-[#E7E8F0] animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E7E8F0] pb-3">
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                {editingVoucher ? 'Edit Voucher Promo' : 'Buat Voucher Promo Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#6B7088] hover:text-[#181F4B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Kode Promo (Huruf Kapital, Unik)
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="misal ERCOFFEE20"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] font-mono font-bold focus:outline-none focus:border-[#C9A876] uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Nama Kampanye Promo
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="misal Promo Merdeka 20%"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Deskripsi Promo
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Diskon khusus pembelian diatas Rp 50.000..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Tipe Diskon
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none cursor-pointer"
                  >
                    <option value="percent">Persentase (%)</option>
                    <option value="fixed">Nominal Potongan (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Nilai Diskon ({formType === 'percent' ? '%' : 'Rp'})
                  </label>
                  <input
                    type="number"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder={formType === 'percent' ? '20' : '10000'}
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Min. Pembelian (Rp)
                  </label>
                  <input
                    type="number"
                    value={formMinPurchase}
                    onChange={(e) => setFormMinPurchase(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Max. Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    placeholder="15000"
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="datetime-local"
                    value={formValidFrom}
                    onChange={(e) => setFormValidFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="datetime-local"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Batas Total Penggunaan (Kuota Voucher)
                </label>
                <input
                  type="number"
                  value={formUsageLimit}
                  onChange={(e) => setFormUsageLimit(e.target.value)}
                  placeholder="misal 100 (kosongkan jika tanpa batas)"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                />
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
                  Aktifkan voucher promo sekarang
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
                  Simpan Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
