'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import Pagination from '@/components/Pagination';
import {
  Gift,
  Award,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  AlertCircle,
  ShieldAlert,
  Info,
  Coins,
  Crown,
  Search,
} from 'lucide-react';

interface LoyaltyTier {
  id: number;
  name: string;
  minPoints: number;
  minOrders?: number | null;
  benefitNote?: string | null;
  sortOrder: number;
}

interface RewardItem {
  id: number;
  name: string;
  pointCost: number;
  description?: string | null;
}

export default function LoyaltyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'tiers' | 'rewards'>('tiers');
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [staff, setStaff] = useState<StaffPayload | null>(null);

  // Pagination for Rewards
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Tier Modal State
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [tierName, setTierName] = useState('');
  const [tierMinPoints, setTierMinPoints] = useState('');
  const [tierMinOrders, setTierMinOrders] = useState('');
  const [tierBenefitNote, setTierBenefitNote] = useState('');
  const [tierSortOrder, setTierSortOrder] = useState('1');

  // Reward Modal State
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [rewardName, setRewardName] = useState('');
  const [rewardPointCost, setRewardPointCost] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');

  // Delete Reward Confirm State
  const [deletingReward, setDeletingReward] = useState<RewardItem | null>(null);

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'tiers') {
        const res = await apiFetch<{ data: LoyaltyTier[] }>('/api/loyalty-tiers');
        setTiers(Array.isArray(res?.data) ? res.data : []);
      } else {
        const res = await apiFetch<{ data: RewardItem[] }>('/api/rewards');
        setRewards(Array.isArray(res?.data) ? res.data : []);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data loyalty');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tier Handlers
  const openAddTierModal = () => {
    setEditingTier(null);
    setTierName('');
    setTierMinPoints('100');
    setTierMinOrders('5');
    setTierBenefitNote('');
    setTierSortOrder(String(tiers.length + 1));
    setError(null);
    setInfoMessage(null);
    setTierModalOpen(true);
  };

  const openEditTierModal = (t: LoyaltyTier) => {
    setEditingTier(t);
    setTierName(t.name);
    setTierMinPoints(String(t.minPoints));
    setTierMinOrders(t.minOrders ? String(t.minOrders) : '');
    setTierBenefitNote(t.benefitNote || '');
    setTierSortOrder(String(t.sortOrder));
    setError(null);
    setInfoMessage(null);
    setTierModalOpen(true);
  };

  const handleSaveTier = async (e: FormEvent) => {
    e.preventDefault();
    if (!tierName.trim() || !tierMinPoints) {
      setError('Nama tier dan minimum poin wajib diisi');
      return;
    }

    if (editingTier) {
      const isUnchanged =
        tierName.trim() === editingTier.name &&
        Number(tierMinPoints) === editingTier.minPoints &&
        (tierMinOrders ? Number(tierMinOrders) : null) === (editingTier.minOrders ?? null) &&
        (tierBenefitNote.trim() || null) === (editingTier.benefitNote || null) &&
        Number(tierSortOrder) === editingTier.sortOrder;

      if (isUnchanged) {
        setInfoMessage('Tidak ada perubahan yang disimpan.');
        setTierModalOpen(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: tierName.trim(),
      minPoints: Number(tierMinPoints),
      minOrders: tierMinOrders ? Number(tierMinOrders) : null,
      benefitNote: tierBenefitNote.trim() || null,
      sortOrder: Number(tierSortOrder),
    };

    try {
      if (editingTier) {
        await apiFetch(`/api/loyalty-tiers/${editingTier.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Loyalty tier "${tierName.trim()}" berhasil diperbarui.`);
      } else {
        await apiFetch('/api/loyalty-tiers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Loyalty tier baru "${tierName.trim()}" berhasil ditambahkan.`);
      }

      setTierModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan loyalty tier');
    } finally {
      setLoading(false);
    }
  };

  // Reward Handlers
  const openAddRewardModal = () => {
    setEditingReward(null);
    setRewardName('');
    setRewardPointCost('50');
    setRewardDesc('');
    setError(null);
    setInfoMessage(null);
    setRewardModalOpen(true);
  };

  const openEditRewardModal = (r: RewardItem) => {
    setEditingReward(r);
    setRewardName(r.name);
    setRewardPointCost(String(r.pointCost));
    setRewardDesc(r.description || '');
    setError(null);
    setInfoMessage(null);
    setRewardModalOpen(true);
  };

  const handleSaveReward = async (e: FormEvent) => {
    e.preventDefault();
    if (!rewardName.trim() || !rewardPointCost) {
      setError('Nama reward dan harga poin wajib diisi');
      return;
    }

    if (editingReward) {
      const isUnchanged =
        rewardName.trim() === editingReward.name &&
        Number(rewardPointCost) === editingReward.pointCost &&
        (rewardDesc.trim() || null) === (editingReward.description || null);

      if (isUnchanged) {
        setInfoMessage('Tidak ada perubahan yang disimpan.');
        setRewardModalOpen(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: rewardName.trim(),
      pointCost: Number(rewardPointCost),
      description: rewardDesc.trim() || null,
    };

    try {
      if (editingReward) {
        await apiFetch(`/api/rewards/${editingReward.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Reward item "${rewardName.trim()}" berhasil diperbarui.`);
      } else {
        await apiFetch('/api/rewards', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Reward item baru "${rewardName.trim()}" berhasil ditambahkan.`);
      }

      setRewardModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan reward item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReward = async () => {
    if (!deletingReward) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/rewards/${deletingReward.id}`, {
        method: 'DELETE',
      });
      setInfoMessage(`Reward item "${deletingReward.name}" telah dihapus.`);
      setDeletingReward(null);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Gagal menghapus reward item');
    } finally {
      setLoading(false);
    }
  };

  const filteredRewards = rewards.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredRewards.length / itemsPerPage));
  const paginatedRewards = filteredRewards.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (staff && staff.role !== 'super_admin') {
    return (
      <div className="py-24 text-center space-y-4 font-source max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-[#C9576B] mx-auto" />
        <h2 className="text-lg font-bold font-albert text-[#181F4B]">Akses Dibatasi</h2>
        <p className="text-xs text-[#6B7088]">
          Halaman Loyalty & Rewards hanya dapat diakses oleh Super Admin.
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
            <Gift className="w-6 h-6 text-[#C9A876]" />
            Loyalty Tiers & Rewards
          </h1>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Kelola jenjang peringkat pelanggan (Tiers) dan katalog item penukaran poin promo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F6F3EC] border border-[#E7E8F0] hover:border-[#C9A876] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C9A876] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {activeTab === 'tiers' ? (
            <button
              onClick={openAddTierModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] rounded-xl text-xs font-bold font-albert transition-all duration-150 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tier Baru</span>
            </button>
          ) : (
            <button
              onClick={openAddRewardModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] rounded-xl text-xs font-bold font-albert transition-all duration-150 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Reward Item</span>
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

      {/* Mode Switcher Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-[#E7E8F0] shadow-xs max-w-md">
        <button
          onClick={() => {
            setActiveTab('tiers');
            setError(null);
            setInfoMessage(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-albert transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'tiers'
              ? 'bg-[#181F4B] text-[#C9A876] shadow-sm'
              : 'text-[#6B7088] hover:text-[#181F4B]'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Loyalty Tiers</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('rewards');
            setError(null);
            setInfoMessage(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-albert transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'rewards'
              ? 'bg-[#181F4B] text-[#C9A876] shadow-sm'
              : 'text-[#6B7088] hover:text-[#181F4B]'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Katalog Rewards</span>
        </button>
      </div>

      {/* TAB 1: LOYALTY TIERS GRID */}
      {activeTab === 'tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-[#6B7088]">
              <div className="w-7 h-7 border-3 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="font-semibold text-sm">Memuat loyalty tiers...</p>
            </div>
          ) : tiers.length > 0 ? (
            tiers.map((tier) => (
              <div
                key={tier.id}
                className="bg-white p-5 rounded-2xl border border-[#E7E8F0] hover:border-[#C9A876]/40 transition-all duration-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-[#6B7088] bg-[#F4F5F9] px-2 py-0.5 rounded border border-[#E7E8F0]">
                      Urutan: #{tier.sortOrder}
                    </span>
                    <Crown className="w-5 h-5 text-[#C9A876]" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold font-albert text-[#181F4B]">
                      {tier.name}
                    </h3>
                    <p className="text-xs text-[#C9A876] font-semibold mt-0.5">
                      Min. {tier.minPoints.toLocaleString('id-ID')} Poin
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 text-xs text-[#6B7088] border-t border-[#E7E8F0]">
                    {tier.minOrders && (
                      <p>
                        Syarat Transaksi:{' '}
                        <strong className="text-[#181F4B]">
                          {tier.minOrders} Order
                        </strong>
                      </p>
                    )}
                    {tier.benefitNote ? (
                      <p className="italic text-[11px] text-[#1E202B]">
                        "{tier.benefitNote}"
                      </p>
                    ) : (
                      <p className="text-[11px] opacity-60">Tidak ada catatan benefit</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E7E8F0]">
                  <button
                    onClick={() => openEditTierModal(tier)}
                    className="w-full py-2 px-3 bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-[#E7E8F0] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 font-albert flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#C9A876]" />
                    <span>Edit Tier</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-[#6B7088]">
              <Crown className="w-10 h-10 text-[#E7E8F0] mx-auto mb-2" />
              <p className="font-semibold text-sm">Belum ada loyalty tier</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REWARDS TABLE */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
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
                placeholder="Cari nama item penukaran poin..."
                className="w-full pl-9 pr-4 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] placeholder-[#6B7088] focus:outline-none focus:border-[#C9A876] transition"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F6F3EC] border-b border-[#E7E8F0] text-[#6B7088] uppercase tracking-wider font-bold font-albert text-[11px]">
                    <th className="py-3.5 px-4">Nama Hadiah</th>
                    <th className="py-3.5 px-4">Deskripsi</th>
                    <th className="py-3.5 px-4">Biaya Poin</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E8F0]">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[#6B7088]">
                        <div className="w-6 h-6 border-2 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>Memuat reward items...</span>
                      </td>
                    </tr>
                  ) : paginatedRewards.length > 0 ? (
                    paginatedRewards.map((reward) => (
                      <tr key={reward.id} className="hover:bg-[#F4F5F9] transition">
                        <td className="py-3.5 px-4 font-bold text-[#181F4B] font-albert">
                          {reward.name}
                        </td>
                        <td className="py-3.5 px-4 text-[#6B7088]">
                          {reward.description || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-[#C9A876] bg-[#FEF6E6] px-2.5 py-1 rounded-lg border border-[#F7E5C4]">
                            <Coins className="w-3.5 h-3.5 text-[#C9A876]" />
                            {reward.pointCost.toLocaleString('id-ID')} Poin
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditRewardModal(reward)}
                              className="p-1.5 rounded-lg bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-transparent text-[#181F4B] transition cursor-pointer hover:scale-105"
                              title="Edit Reward"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingReward(reward)}
                              className="p-1.5 rounded-lg bg-[#FDF0F2] hover:bg-[#FAF1F3] border border-transparent text-[#C9576B] transition cursor-pointer hover:scale-105"
                              title="Hapus Reward"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-[#6B7088]">
                        <Gift className="w-8 h-8 text-[#E7E8F0] mx-auto mb-2" />
                        <p className="font-semibold text-sm">Belum ada reward item</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRewards.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(num) => {
                setItemsPerPage(num);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal Add / Edit Loyalty Tier */}
      {tierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#E7E8F0] animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#E7E8F0] pb-3">
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                {editingTier ? 'Edit Loyalty Tier' : 'Tambah Loyalty Tier Baru'}
              </h3>
              <button
                onClick={() => setTierModalOpen(false)}
                className="p-1 text-[#6B7088] hover:text-[#181F4B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Nama Tier (misal Gold, Platinum)
                </label>
                <input
                  type="text"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  placeholder="Platinum Member"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none focus:border-[#C9A876]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Min. Poin
                  </label>
                  <input
                    type="number"
                    value={tierMinPoints}
                    onChange={(e) => setTierMinPoints(e.target.value)}
                    placeholder="1000"
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Min. Order (Opsional)
                  </label>
                  <input
                    type="number"
                    value={tierMinOrders}
                    onChange={(e) => setTierMinOrders(e.target.value)}
                    placeholder="10"
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Urutan Hirarki (Sort Order)
                </label>
                <input
                  type="number"
                  value={tierSortOrder}
                  onChange={(e) => setTierSortOrder(e.target.value)}
                  placeholder="1"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Catatan Benefit Member
                </label>
                <textarea
                  value={tierBenefitNote}
                  onChange={(e) => setTierBenefitNote(e.target.value)}
                  placeholder="Diskon 10% setiap ulang tahun & gratis ongkir..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E7E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTierModalOpen(false)}
                  className="px-4 py-2 bg-[#F4F5F9] hover:bg-[#E7E8F0] text-[#6B7088] font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] font-bold text-xs rounded-xl transition shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  Simpan Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Reward Item */}
      {rewardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#E7E8F0] animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#E7E8F0] pb-3">
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                {editingReward ? 'Edit Reward Item' : 'Tambah Reward Item Baru'}
              </h3>
              <button
                onClick={() => setRewardModalOpen(false)}
                className="p-1 text-[#6B7088] hover:text-[#181F4B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Nama Hadiah Penukaran
                </label>
                <input
                  type="text"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  placeholder="misal Voucher Diskon Rp 15.000"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none focus:border-[#C9A876]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Harga Penukaran Poin
                </label>
                <input
                  type="number"
                  value={rewardPointCost}
                  onChange={(e) => setRewardPointCost(e.target.value)}
                  placeholder="50"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Deskripsi Syarat & Ketentuan Penukaran
                </label>
                <textarea
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  placeholder="Dapat ditukarkan langsung di kasir toko fisik..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E7E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRewardModalOpen(false)}
                  className="px-4 py-2 bg-[#F4F5F9] hover:bg-[#E7E8F0] text-[#6B7088] font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] font-bold text-xs rounded-xl transition shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  Simpan Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Reward Confirm Modal */}
      {deletingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-[#E7E8F0]">
            <div className="w-12 h-12 rounded-full bg-[#FDF0F2] text-[#C9576B] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                Hapus Reward Item?
              </h3>
              <p className="text-xs text-[#6B7088] mt-1">
                Item hadiah <span className="font-bold text-[#181F4B]">"{deletingReward.name}"</span> akan dihapus dari katalog penukaran poin.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingReward(null)}
                className="flex-1 py-2.5 bg-[#F4F5F9] text-[#6B7088] font-bold text-xs rounded-xl cursor-pointer hover:bg-[#E7E8F0]"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteReward}
                disabled={loading}
                className="flex-1 py-2.5 bg-[#C9576B] text-white font-bold text-xs rounded-xl hover:bg-red transition cursor-pointer hover:scale-[1.02]"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
