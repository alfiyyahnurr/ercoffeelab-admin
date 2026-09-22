'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { apiFetch } from '@/lib/api-client';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import { useOutletContext } from '@/context/OutletContext';
import Pagination from '@/components/Pagination';
import {
  Store,
  Plus,
  Pencil,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  XCircle,
  Info,
  Navigation,
  Truck,
  Trash2,
} from 'lucide-react';

interface DeliveryTierItem {
  id?: number;
  minDistanceKm: number;
  maxDistanceKm: number;
  fee: number;
  isActive: boolean;
}

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
  deliveryFee?: number;
  maxDeliveryDistanceKm?: number;
  isDeliveryEnabled?: boolean;
}

export default function OutletsGovernancePage() {
  const { staff: contextStaff, isSuperAdmin: contextIsSuperAdmin, selectedOutletId } = useOutletContext();
  const [outlets, setOutlets] = useState<OutletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [localStaff, setLocalStaff] = useState<StaffPayload | null>(null);

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

  // Delivery Settings Modal State
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedOutletForDelivery, setSelectedOutletForDelivery] = useState<OutletItem | null>(null);
  const [deliveryMaxKm, setDeliveryMaxKm] = useState<number>(10);
  const [deliveryEnabled, setDeliveryEnabled] = useState<boolean>(true);
  const [tiersList, setTiersList] = useState<DeliveryTierItem[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [savingTiers, setSavingTiers] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      const s = parseStaffToken(token);
      setLocalStaff(s);
    }
  }, []);

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

  const openDeliveryModal = async (outlet: OutletItem) => {
    setSelectedOutletForDelivery(outlet);
    setDeliveryMaxKm(outlet.maxDeliveryDistanceKm ?? 10);
    setDeliveryEnabled(outlet.isDeliveryEnabled ?? true);
    setDeliveryModalOpen(true);
    setLoadingTiers(true);
    setError(null);

    try {
      const res = await apiFetch<{ data: DeliveryTierItem[] }>(`/api/outlets/${outlet.id}/delivery-tiers`);
      if (Array.isArray(res?.data) && res.data.length > 0) {
        setTiersList(res.data);
      } else {
        // Default template tiers if none exist
        setTiersList([
          { minDistanceKm: 0, maxDistanceKm: 5, fee: 10000, isActive: true },
          { minDistanceKm: 5.01, maxDistanceKm: 10, fee: 15000, isActive: true },
        ]);
      }
    } catch (err: any) {
      console.error('Failed to load delivery tiers:', err);
      setTiersList([
        { minDistanceKm: 0, maxDistanceKm: 5, fee: 10000, isActive: true },
        { minDistanceKm: 5.01, maxDistanceKm: 10, fee: 15000, isActive: true },
      ]);
    } finally {
      setLoadingTiers(false);
    }
  };

  const addTierRow = () => {
    const lastTier = tiersList[tiersList.length - 1];
    const newMin = lastTier ? Math.round((lastTier.maxDistanceKm + 0.01) * 100) / 100 : 0;
    const newMax = Math.round((newMin + 5) * 100) / 100;
    const newFee = lastTier ? lastTier.fee + 5000 : 10000;

    setTiersList((prev) => [
      ...prev,
      { minDistanceKm: newMin, maxDistanceKm: newMax, fee: newFee, isActive: true },
    ]);
  };

  const updateTierRow = (index: number, field: keyof DeliveryTierItem, value: any) => {
    setTiersList((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const removeTierRow = (index: number) => {
    setTiersList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDeliveryTiers = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOutletForDelivery) return;

    if (tiersList.length === 0) {
      alert('Minimal harus memiliki 1 tier ongkos kirim delivery.');
      return;
    }

    setSavingTiers(true);
    try {
      await apiFetch(`/api/outlets/${selectedOutletForDelivery.id}/delivery-tiers`, {
        method: 'PUT',
        body: JSON.stringify({
          maxDeliveryDistanceKm: deliveryMaxKm,
          isDeliveryEnabled: deliveryEnabled,
          tiers: tiersList,
        }),
      });

      setInfoMessage(`Pengaturan biaya delivery cabang "${selectedOutletForDelivery.name}" berhasil disimpan.`);
      setDeliveryModalOpen(false);
      await fetchOutlets();
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan pengaturan delivery');
    } finally {
      setSavingTiers(false);
    }
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
        `Status operasional "${outlet.name}" diubah menjadi ${nextStatus ? 'BEROPERASI (OPEN)' : 'TUTUP SEMENTARA'
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

  const currentStaff = contextStaff || localStaff;
  const isSuperAdmin = contextIsSuperAdmin || currentStaff?.role === 'super_admin';
  const effectiveOutletId = currentStaff?.outletId ?? selectedOutletId ?? null;

  const filteredOutlets = outlets
    .filter((o) => {
      // Jika Outlet Admin: HANYA tampilkan cabang miliknya sendiri
      if (!isSuperAdmin) {
        if (effectiveOutletId) {
          return Number(o.id) === Number(effectiveOutletId);
        }
        return false;
      }
      return true;
    })
    .filter((o) => {
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

  return (
    <div className="space-y-6 font-source">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold font-albert text-[#181F4B] flex items-center gap-2">
              <Store className="w-6 h-6 text-[#C9A876]" />
              Outlet & Delivery
            </h1>
            {!isSuperAdmin && filteredOutlets[0] && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181F4B] text-[#C9A876] text-xs font-bold font-albert shadow-xs">
                <Store className="w-3.5 h-3.5" />
                <span>{filteredOutlets[0].name}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7088] mt-0.5">
            {isSuperAdmin
              ? 'Kelola data cabang toko fisik ERCoffeeLab, jam operasional, lokasi maps, serta konfigurasi radius dan tarif delivery.'
              : `Kelola jam operasional, status buka/tutup toko, serta konfigurasi radius dan tarif delivery cabang ${filteredOutlets[0]?.name || 'Anda'}.`}
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

          {isSuperAdmin && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] rounded-xl text-xs font-bold font-albert transition-all duration-150 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Outlet Cabang</span>
            </button>
          )}
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

      {/* Search Bar (Super Admin Only) */}
      {isSuperAdmin && (
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
      )}

      {/* Outlets Display */}
      {isSuperAdmin ? (
        /* Super Admin: Multi-column Grid Layout */
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95 ${outlet.isOpen
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
                  <div className="pt-3 border-t border-[#E7E8F0] grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openEditModal(outlet)}
                      className="py-2 px-3 bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-[#E7E8F0] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 font-albert flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#C9A876]" />
                      <span>Edit Info</span>
                    </button>

                    <button
                      onClick={() => openDeliveryModal(outlet)}
                      className="py-2 px-3 bg-[#FEF6E6] hover:bg-[#FDF0D5] hover:border-[#C9A876] border border-[#F7E5C4] rounded-xl text-xs font-bold text-[#181F4B] transition-all duration-150 font-albert flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Truck className="w-3.5 h-3.5 text-[#C9A876]" />
                      <span>Atur Delivery</span>
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
      ) : (
        /* Outlet Admin: Dedicated Single Outlet Card Layout (No Pagination, Clean Card) */
        <div className="max-w-xl">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-[#E7E8F0] text-center text-[#6B7088] shadow-xs">
              <div className="w-7 h-7 border-3 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="font-semibold text-sm">Memuat data cabang outlet...</p>
            </div>
          ) : filteredOutlets.length > 0 ? (
            (() => {
              const outlet = filteredOutlets[0];
              const isUpdating = updatingId === outlet.id;

              return (
                <div className="bg-white p-6 rounded-2xl border border-[#E7E8F0] hover:border-[#C9A876]/40 transition-all duration-200 shadow-xs space-y-5">
                  <div className="space-y-4">
                    {/* Outlet Header & Operating Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#F6F3EC] border border-[#C9A876]/30 flex items-center justify-center text-[#C9A876] shrink-0">
                          <Store className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg font-albert text-[#181F4B]">
                            {outlet.name}
                          </h3>
                          <p className="text-xs text-[#6B7088] font-mono">
                            ID Cabang: #{outlet.id}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Status Switch */}
                      <button
                        onClick={() => handleToggleOperating(outlet)}
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95 ${outlet.isOpen
                            ? 'bg-[#EAF5EE] text-[#3E8A5A] border border-[#C6E7D2] hover:bg-[#d8eedf]'
                            : 'bg-[#FDF0F2] text-[#C9576B] border border-[#FAF1F3] hover:bg-[#fae2e6]'
                          }`}
                        title="Klik untuk ubah status operasional toko"
                      >
                        {outlet.isOpen ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>AKTIF (BUKA)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>TUTUP SEMENTARA</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Details List */}
                    <div className="space-y-2.5 pt-2 text-xs text-[#6B7088]">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-[#C9A876] shrink-0 mt-0.5" />
                        <span className="leading-relaxed text-[#1E202B] font-medium">
                          {outlet.address}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-[#C9A876] shrink-0" />
                        <span>
                          Jam Operasional:{' '}
                          <strong className="text-[#181F4B]">
                            {outlet.openHour || '07:00'} - {outlet.closeHour || '22:00'}
                          </strong>
                        </span>
                      </div>

                      {outlet.phone && (
                        <div className="flex items-center gap-2.5">
                          <Phone className="w-4 h-4 text-[#C9A876] shrink-0" />
                          <span className="text-[#1E202B] font-medium">{outlet.phone}</span>
                        </div>
                      )}

                      {(outlet.latitude !== undefined && outlet.latitude !== null) && (
                        <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#6B7088]">
                          <Navigation className="w-3.5 h-3.5 text-[#C9A876] shrink-0" />
                          <span>
                            Koordinat GPS: {outlet.latitude}, {outlet.longitude}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2.5 pt-1 border-t border-[#F4F5F9] text-xs">
                        <Truck className="w-4 h-4 text-[#C9A876] shrink-0" />
                        <span>
                          Layanan Delivery:{' '}
                          <strong className={outlet.isDeliveryEnabled !== false ? 'text-[#3E8A5A]' : 'text-[#C9576B]'}>
                            {outlet.isDeliveryEnabled !== false ? 'Aktif' : 'Nonaktif'}
                          </strong>
                          {outlet.maxDeliveryDistanceKm ? ` (Maks. ${outlet.maxDeliveryDistanceKm} km)` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-4 border-t border-[#E7E8F0] grid grid-cols-2 gap-3">
                    <button
                      onClick={() => openEditModal(outlet)}
                      className="py-2.5 px-4 bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-[#E7E8F0] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 font-albert flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Pencil className="w-4 h-4 text-[#C9A876]" />
                      <span>Edit Info Toko</span>
                    </button>

                    <button
                      onClick={() => openDeliveryModal(outlet)}
                      className="py-2.5 px-4 bg-[#FEF6E6] hover:bg-[#FDF0D5] hover:border-[#C9A876] border border-[#F7E5C4] rounded-xl text-xs font-bold text-[#181F4B] transition-all duration-150 font-albert flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Truck className="w-4 h-4 text-[#C9A876]" />
                      <span>Atur Delivery & Tarif</span>
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-[#E7E8F0] text-center text-[#6B7088] shadow-xs">
              <Store className="w-10 h-10 text-[#E7E8F0] mx-auto mb-2" />
              <p className="font-semibold text-sm text-[#1E202B]">Cabang outlet Anda belum terdaftar</p>
            </div>
          )}
        </div>
      )}

      {/* Reusable Pagination (Super Admin Only) */}
      {isSuperAdmin && (
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
      )}

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

      {/* Delivery Tier Settings Modal */}
      {deliveryModalOpen && selectedOutletForDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 border border-[#E7E8F0] animate-in fade-in max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E7E8F0] pb-4">
              <div>
                <h3 className="font-bold text-base font-albert text-[#181F4B] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#C9A876]" />
                  Pengaturan Biaya Delivery Berdasarkan Jarak
                </h3>
                <p className="text-xs text-[#6B7088] mt-0.5">
                  Cabang: <strong className="text-[#181F4B]">{selectedOutletForDelivery.name}</strong> (ID: #{selectedOutletForDelivery.id})
                </p>
              </div>
              <button
                onClick={() => setDeliveryModalOpen(false)}
                className="p-1.5 text-[#6B7088] hover:text-[#181F4B] rounded-xl hover:bg-[#F4F5F9] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryTiers} className="space-y-5">
              {/* General Delivery Settings */}
              <div className="p-4 rounded-2xl bg-[#FAFAFD] border border-[#E7E8F0] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#181F4B] block">
                      Layanan Pesan Antar (Delivery)
                    </label>
                    <p className="text-[11px] text-[#6B7088] mt-0.5">
                      Aktifkan atau nonaktifkan penerimaan order delivery khusus di cabang ini.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={deliveryEnabled}
                    onChange={(e) => setDeliveryEnabled(e.target.checked)}
                    className="w-5 h-5 accent-[#C9A876] rounded cursor-pointer"
                  />
                </div>

                <div className="pt-3 border-t border-[#E7E8F0]">
                  <label className="text-xs font-bold text-[#181F4B] block mb-1">
                    Batas Jarak Maksimal Pengiriman (Radius KM)
                  </label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="100"
                      value={deliveryMaxKm}
                      onChange={(e) => setDeliveryMaxKm(parseFloat(e.target.value) || 10)}
                      className="w-28 px-3 py-2 bg-white border border-[#E7E8F0] rounded-xl text-xs font-bold text-[#181F4B] focus:outline-none focus:border-[#C9A876]"
                      required
                    />
                    <span className="text-xs font-bold text-[#6B7088]">Kilometer (KM)</span>
                  </div>
                  <p className="text-[11px] text-[#C9576B] mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Pelanggan dengan jarak lebih dari {deliveryMaxKm} km otomatis ditolak dan tidak dapat checkout delivery.</span>
                  </p>
                </div>
              </div>

              {/* Tier Pricing Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-albert text-[#181F4B]">
                      Tingkatan Tarif Ongkir (Distance Tiers)
                    </h4>
                    <p className="text-[11px] text-[#6B7088]">
                      Tentukan biaya ongkir otomatis berdasarkan rentang jarak kilometer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTierRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F3EC] hover:bg-[#EBE5D8] border border-[#C9A876]/40 rounded-xl text-xs font-bold text-[#181F4B] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C9A876]" />
                    <span>Tambah Baris Tier</span>
                  </button>
                </div>

                {loadingTiers ? (
                  <div className="py-8 text-center text-[#6B7088] text-xs">
                    <div className="w-6 h-6 border-2 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat aturan tier delivery...</span>
                  </div>
                ) : (
                  <div className="border border-[#E7E8F0] rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F8F9FD] border-b border-[#E7E8F0] text-[#181F4B] font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Tier</th>
                          <th className="py-2.5 px-3">Jarak Min (KM)</th>
                          <th className="py-2.5 px-3">Jarak Maks (KM)</th>
                          <th className="py-2.5 px-3">Tarif Ongkir (Rp)</th>
                          <th className="py-2.5 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7E8F0]">
                        {tiersList.map((tier, idx) => (
                          <tr key={idx} className="hover:bg-[#FAFAFD] transition">
                            <td className="py-2.5 px-3 font-bold text-[#6B7088]">
                              Tier {idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={tier.minDistanceKm}
                                onChange={(e) => updateTierRow(idx, 'minDistanceKm', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 bg-white border border-[#E7E8F0] rounded-lg text-xs font-mono font-bold"
                                required
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={tier.maxDistanceKm}
                                onChange={(e) => updateTierRow(idx, 'maxDistanceKm', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 bg-white border border-[#E7E8F0] rounded-lg text-xs font-mono font-bold"
                                required
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] text-[#6B7088] font-semibold">Rp</span>
                                <input
                                  type="number"
                                  step="1000"
                                  min="0"
                                  value={tier.fee}
                                  onChange={(e) => updateTierRow(idx, 'fee', parseInt(e.target.value, 10) || 0)}
                                  className="w-28 px-2 py-1 bg-white border border-[#E7E8F0] rounded-lg text-xs font-bold text-[#181F4B]"
                                  required
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeTierRow(idx)}
                                disabled={tiersList.length === 1}
                                className="p-1 text-[#6B7088] hover:text-[#C9576B] rounded-lg hover:bg-[#FDF0F2] transition disabled:opacity-30 cursor-pointer"
                                title="Hapus tier ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#E7E8F0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeliveryModalOpen(false)}
                  className="px-4 py-2 bg-[#F4F5F9] hover:bg-[#E7E8F0] text-[#6B7088] font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTiers}
                  className="px-5 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] font-bold text-xs rounded-xl transition shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingTiers ? (
                    <div className="w-3.5 h-3.5 border-2 border-[#C9A876] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan Pengaturan Delivery</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
