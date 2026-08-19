'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import Pagination from '@/components/Pagination';
import {
  Store,
  Plus,
  Pencil,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  ShieldAlert,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  XCircle,
  Info,
  Navigation,
} from 'lucide-react';

interface OutletItem {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  openHour?: string | null;
  closeHour?: string | null;
  operatingHours?: string | null;
  isOpen: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export default function OutletsGovernancePage() {
  const router = useRouter();
  const [outlets, setOutlets] = useState<OutletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [staff, setStaff] = useState<StaffPayload | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<OutletItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formOpenHour, setFormOpenHour] = useState('07:00');
  const [formCloseHour, setFormCloseHour] = useState('22:00');
  const [formIsOpen, setFormIsOpen] = useState(true);
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');

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
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: OutletItem[] }>('/api/outlets');
      if (Array.isArray(res?.data)) {
        setOutlets(res.data);
      } else if (Array.isArray(res)) {
        setOutlets(res as any);
      } else {
        setOutlets([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar outlet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  const openAddModal = () => {
    setEditingOutlet(null);
    setFormName('');
    setFormAddress('');
    setFormPhone('0812-3456-7890');
    setFormOpenHour('07:00');
    setFormCloseHour('22:00');
    setFormIsOpen(true);
    setFormLat('');
    setFormLng('');
    setError(null);
    setInfoMessage(null);
    setModalOpen(true);
  };

  const openEditModal = (outlet: OutletItem) => {
    setEditingOutlet(outlet);
    setFormName(outlet.name);
    setFormAddress(outlet.address);
    setFormPhone(outlet.phone || '');
    setFormOpenHour(outlet.openHour || '07:00');
    setFormCloseHour(outlet.closeHour || '22:00');
    setFormIsOpen(outlet.isOpen);
    setFormLat(outlet.latitude !== undefined && outlet.latitude !== null ? String(outlet.latitude) : '');
    setFormLng(outlet.longitude !== undefined && outlet.longitude !== null ? String(outlet.longitude) : '');
    setError(null);
    setInfoMessage(null);
    setModalOpen(true);
  };

  const handleToggleOperating = async (outlet: OutletItem) => {
    setUpdatingId(outlet.id);
    setError(null);
    setInfoMessage(null);
    const nextStatus = !outlet.isOpen;

    try {
      await apiFetch(`/api/outlets/${outlet.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isOpen: nextStatus }),
      });

      setOutlets((prev) =>
        prev.map((o) => (o.id === outlet.id ? { ...o, isOpen: nextStatus } : o))
      );
      setInfoMessage(
        `Status operasional "${outlet.name}" diubah menjadi ${
          nextStatus ? 'BEROPERASI (OPEN)' : 'TUTUP SEMENTARA'
        }.`
      );
    } catch (err: any) {
      setError(err?.message || 'Gagal mengubah status operasional outlet');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveOutlet = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim()) {
      setError('Nama outlet dan alamat wajib diisi');
      return;
    }

    // Check no changes
    if (editingOutlet) {
      const isUnchanged =
        formName.trim() === editingOutlet.name &&
        formAddress.trim() === editingOutlet.address &&
        (formPhone.trim() || null) === (editingOutlet.phone || null) &&
        (formOpenHour || null) === (editingOutlet.openHour || null) &&
        (formCloseHour || null) === (editingOutlet.closeHour || null) &&
        formIsOpen === editingOutlet.isOpen &&
        (formLat ? Number(formLat) : null) === (editingOutlet.latitude ?? null) &&
        (formLng ? Number(formLng) : null) === (editingOutlet.longitude ?? null);

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
      name: formName.trim(),
      address: formAddress.trim(),
      phone: formPhone.trim() || null,
      openHour: formOpenHour || null,
      closeHour: formCloseHour || null,
      isOpen: formIsOpen,
      latitude: formLat ? Number(formLat) : null,
      longitude: formLng ? Number(formLng) : null,
    };

    try {
      if (editingOutlet) {
        await apiFetch(`/api/outlets/${editingOutlet.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Data outlet "${formName.trim()}" berhasil diperbarui.`);
      } else {
        await apiFetch('/api/outlets', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Outlet cabang baru "${formName.trim()}" berhasil ditambahkan.`);
      }

      setModalOpen(false);
      await fetchOutlets();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan data outlet');
    } finally {
      setLoading(false);
    }
  };

  const filteredOutlets = outlets.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      o.name.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredOutlets.length / itemsPerPage));
  const paginatedOutlets = filteredOutlets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (staff && staff.role !== 'super_admin') {
    return (
      <div className="py-24 text-center space-y-4 font-source max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-[#C9576B] mx-auto" />
        <h2 className="text-lg font-bold font-albert text-[#181F4B]">Akses Dibatasi</h2>
        <p className="text-xs text-[#6B7088]">
          Halaman Outlets Governance hanya dapat diakses oleh Super Admin.
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
            <Store className="w-6 h-6 text-[#C9A876]" />
            Outlets Governance
          </h1>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Kelola cabang toko fisik ERCoffeeLab, jam operasional, lokasi maps, dan status buka/tutup toko.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOutlets}
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
            <span>Tambah Outlet Cabang</span>
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
            placeholder="Cari nama outlet atau alamat lokasi..."
            className="w-full pl-9 pr-4 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] placeholder-[#6B7088] focus:outline-none focus:border-[#C9A876] transition"
          />
        </div>
      </div>

      {/* Outlets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-[#6B7088]">
            <div className="w-7 h-7 border-3 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="font-semibold text-sm">Memuat cabang outlet...</p>
          </div>
        ) : paginatedOutlets.length > 0 ? (
          paginatedOutlets.map((outlet) => {
            const isUpdating = updatingId === outlet.id;

            return (
              <div
                key={outlet.id}
                className="bg-white p-5 rounded-2xl border border-[#E7E8F0] hover:border-[#C9A876]/40 transition-all duration-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Outlet Header & Operating Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#F6F3EC] border border-[#C9A876]/30 flex items-center justify-center text-[#C9A876] shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base font-albert text-[#181F4B]">
                          {outlet.name}
                        </h3>
                        <p className="text-[10px] text-[#6B7088] font-mono">
                          ID: #{outlet.id}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Status Switch */}
                    <button
                      onClick={() => handleToggleOperating(outlet)}
                      disabled={isUpdating}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95 ${
                        outlet.isOpen
                          ? 'bg-[#EAF5EE] text-[#3E8A5A] border border-[#C6E7D2] hover:bg-[#d8eedf]'
                          : 'bg-[#FDF0F2] text-[#C9576B] border border-[#FAF1F3] hover:bg-[#fae2e6]'
                      }`}
                      title="Klik untuk ubah status operasional toko"
                    >
                      {outlet.isOpen ? (
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
                  </div>

                  {/* Details List */}
                  <div className="space-y-2 pt-2 text-xs text-[#6B7088]">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#C9A876] shrink-0 mt-0.5" />
                      <span className="leading-relaxed text-[#1E202B]">
                        {outlet.address}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#C9A876] shrink-0" />
                      <span>
                        Jam Buka:{' '}
                        <strong className="text-[#181F4B]">
                          {outlet.openHour || '07:00'} - {outlet.closeHour || '22:00'}
                        </strong>
                      </span>
                    </div>

                    {outlet.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#C9A876] shrink-0" />
                        <span>{outlet.phone}</span>
                      </div>
                    )}

                    {(outlet.latitude !== undefined && outlet.latitude !== null) && (
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#6B7088]">
                        <Navigation className="w-3.5 h-3.5 text-[#C9A876] shrink-0" />
                        <span>
                          {outlet.latitude}, {outlet.longitude}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-[#E7E8F0] flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(outlet)}
                    className="w-full py-2 px-3 bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-[#E7E8F0] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 font-albert flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#C9A876]" />
                    <span>Edit Informasi Outlet</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-[#6B7088]">
            <Store className="w-10 h-10 text-[#E7E8F0] mx-auto mb-2" />
            <p className="font-semibold text-sm text-[#1E202B]">Cabang outlet tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* Reusable Pagination matching reference image */}
      <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOutlets.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(num) => {
            setItemsPerPage(num);
            setCurrentPage(1);
          }}
          itemsPerPageOptions={[6, 9, 12, 24]}
        />
      </div>

      {/* Add / Edit Outlet Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#E7E8F0] animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E7E8F0] pb-3">
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                {editingOutlet ? 'Edit Outlet Cabang' : 'Tambah Outlet Cabang Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#6B7088] hover:text-[#181F4B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutlet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Nama Outlet
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="misal ERCoffeeLab Bandung"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none focus:border-[#C9A876]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Alamat Lengkap Toko
                </label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Jl. Dago No. 123, Coblong, Bandung"
                  rows={2}
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none focus:border-[#C9A876]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Jam Buka Toko
                  </label>
                  <input
                    type="text"
                    value={formOpenHour}
                    onChange={(e) => setFormOpenHour(e.target.value)}
                    placeholder="07:00"
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Jam Tutup Toko
                  </label>
                  <input
                    type="text"
                    value={formCloseHour}
                    onChange={(e) => setFormCloseHour(e.target.value)}
                    placeholder="22:00"
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Nomor Telepon Toko
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Latitude Koordinat
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    placeholder="-6.917464"
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Longitude Koordinat
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    placeholder="107.619123"
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsOpen"
                  checked={formIsOpen}
                  onChange={(e) => setFormIsOpen(e.target.checked)}
                  className="w-4 h-4 accent-[#C9A876] rounded cursor-pointer"
                />
                <label htmlFor="formIsOpen" className="text-xs font-semibold text-[#181F4B] cursor-pointer">
                  Toko dalam status AKTIF (Beroperasi)
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
                  Simpan Outlet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
