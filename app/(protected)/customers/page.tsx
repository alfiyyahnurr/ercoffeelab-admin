'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import Pagination from '@/components/Pagination';
import {
  Users,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Coins,
  Crown,
  ShoppingBag,
  Phone,
  Mail,
  Calendar,
  Eye,
  UserCheck,
} from 'lucide-react';

interface CustomerItem {
  id: number;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  gender?: string | null;
  isVerified: boolean;
  points: number;
  totalOrders: number;
  tierId?: number | null;
  tierName?: string | null;
  createdAt: string;
}

interface CustomerDetail extends CustomerItem {
  recentOrders?: Array<{
    id: number | string;
    orderNumber: string;
    total: number;
    orderStatus: string;
    createdAt: string;
  }>;
}

export default function CustomersManagementPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [staff, setStaff] = useState<StaffPayload | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Customer Detail Modal State
  const [inspectingCustomer, setInspectingCustomer] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: CustomerItem[] }>('/api/customers');
      if (Array.isArray(res?.data)) {
        setCustomers(res.data);
      } else if (Array.isArray(res)) {
        setCustomers(res as any);
      } else {
        setCustomers([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar pelanggan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleInspectCustomer = async (c: CustomerItem) => {
    setInspectingCustomer(c);
    setLoadingDetail(true);
    try {
      const res = await apiFetch<CustomerDetail>(`/api/customers/${c.id}`);
      if (res) {
        setInspectingCustomer(res);
      }
    } catch {
      // Keep existing customer data if detail fails
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.fullName && c.fullName.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (staff && staff.role !== 'super_admin') {
    return (
      <div className="py-24 text-center space-y-4 font-source max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-[#C9576B] mx-auto" />
        <h2 className="text-lg font-bold font-albert text-[#181F4B]">Akses Dibatasi</h2>
        <p className="text-xs text-[#6B7088]">
          Halaman Data Pelanggan hanya dapat diakses oleh Super Admin.
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
            <UserCheck className="w-6 h-6 text-[#C9A876]" />
            Data Pelanggan (Customers)
          </h1>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Daftar seluruh akun pelanggan terdaftar, peringkat loyalty tier, akumulasi poin, dan riwayat pesanan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F6F3EC] border border-[#E7E8F0] hover:border-[#C9A876] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C9A876] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

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
            placeholder="Cari nama pelanggan, nomor telepon, atau email..."
            className="w-full pl-9 pr-4 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] placeholder-[#6B7088] focus:outline-none focus:border-[#C9A876] transition"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F6F3EC] border-b border-[#E7E8F0] text-[#6B7088] uppercase tracking-wider font-bold font-albert text-[11px]">
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">Kontak (Telepon & Email)</th>
                <th className="py-3.5 px-4">Loyalty Tier & Poin</th>
                <th className="py-3.5 px-4 text-center">Total Order</th>
                <th className="py-3.5 px-4 text-center">Verifikasi</th>
                <th className="py-3.5 px-4 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B7088]">
                    <div className="w-6 h-6 border-2 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat data pelanggan...</span>
                  </td>
                </tr>
              ) : paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F4F5F9] transition">
                    {/* Full Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#181F4B] text-[#C9A876] flex items-center justify-center font-bold font-albert text-xs shrink-0 shadow-xs">
                          {c.fullName?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-[#181F4B] font-albert text-sm">
                            {c.fullName || 'Pelanggan Anonim'}
                          </p>
                          <p className="text-[10px] text-[#6B7088]">
                            Bergabung: {new Date(c.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contacts */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      {c.phone && (
                        <p className="text-xs text-[#1E202B] font-mono flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#6B7088]" />
                          <span>{c.phone}</span>
                        </p>
                      )}
                      {c.email && (
                        <p className="text-xs text-[#6B7088] font-mono flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#6B7088]" />
                          <span>{c.email}</span>
                        </p>
                      )}
                    </td>

                    {/* Tier & Points */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] text-[#181F4B] bg-[#F4F5F9] px-2 py-0.5 rounded border border-[#E7E8F0]">
                          <Crown className="w-3 h-3 text-[#C9A876]" />
                          {c.tierName || 'Bronze'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#C9A876] flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        {c.points.toLocaleString('id-ID')} Poin
                      </p>
                    </td>

                    {/* Total Orders */}
                    <td className="py-3.5 px-4 text-center font-bold text-[#181F4B]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#FEF6E6] text-[#181F4B] border border-[#F7E5C4]">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#C9A876]" />
                        {c.totalOrders} Order
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3.5 px-4 text-center">
                      {c.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EAF5EE] text-[#3E8A5A]">
                          <CheckCircle2 className="w-3 h-3" />
                          TERVERIFIKASI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F4F5F9] text-[#6B7088] border border-[#E7E8F0]">
                          <XCircle className="w-3 h-3 text-[#6B7088]" />
                          BELUM VERIFIKASI
                        </span>
                      )}
                    </td>

                    {/* Inspect Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleInspectCustomer(c)}
                        className="p-1.5 rounded-lg bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-transparent text-[#181F4B] transition cursor-pointer hover:scale-105"
                        title="Lihat Detail Pelanggan"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#6B7088]">
                    <Users className="w-8 h-8 text-[#E7E8F0] mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#1E202B]">
                      Data pelanggan tidak ditemukan
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCustomers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(num) => {
            setItemsPerPage(num);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Customer Detail Modal */}
      {inspectingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-[#E7E8F0] animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E7E8F0] pb-3">
              <h3 className="font-bold text-base font-albert text-[#181F4B] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#C9A876]" />
                Detail Profil Pelanggan
              </h3>
              <button
                onClick={() => setInspectingCustomer(null)}
                className="p-1 text-[#6B7088] hover:text-[#181F4B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F6F3EC] border border-[#E7E8F0]">
                <div className="w-12 h-12 rounded-full bg-[#181F4B] text-[#C9A876] flex items-center justify-center font-bold font-albert text-lg shrink-0 shadow-md">
                  {inspectingCustomer.fullName?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div>
                  <h4 className="font-bold text-base font-albert text-[#181F4B]">
                    {inspectingCustomer.fullName || 'Pelanggan Anonim'}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 font-bold text-[10px] text-[#181F4B] bg-white px-2 py-0.5 rounded border border-[#E7E8F0]">
                      <Crown className="w-3 h-3 text-[#C9A876]" />
                      {inspectingCustomer.tierName || 'Bronze Member'}
                    </span>
                    <span className="text-[#C9A876] font-bold">
                      {inspectingCustomer.points.toLocaleString('id-ID')} Poin
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F4F5F9] p-3 rounded-xl border border-[#E7E8F0]">
                  <span className="text-[#6B7088] font-semibold block mb-0.5">Nomor Telepon</span>
                  <span className="font-mono text-[#181F4B] font-bold">
                    {inspectingCustomer.phone || '-'}
                  </span>
                </div>

                <div className="bg-[#F4F5F9] p-3 rounded-xl border border-[#E7E8F0]">
                  <span className="text-[#6B7088] font-semibold block mb-0.5">Email</span>
                  <span className="font-mono text-[#181F4B] font-bold truncate block">
                    {inspectingCustomer.email || '-'}
                  </span>
                </div>
              </div>

              {/* Recent Orders History */}
              <div className="pt-2 border-t border-[#E7E8F0] space-y-2">
                <h5 className="font-bold text-xs text-[#181F4B] font-albert">
                  Riwayat Pesanan Terakhir ({inspectingCustomer.recentOrders?.length || 0})
                </h5>

                {loadingDetail ? (
                  <div className="py-6 text-center text-[#6B7088]">
                    <div className="w-5 h-5 border-2 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                    <span>Memuat riwayat transaksi...</span>
                  </div>
                ) : inspectingCustomer.recentOrders && inspectingCustomer.recentOrders.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {inspectingCustomer.recentOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 bg-[#F4F5F9] rounded-xl border border-[#E7E8F0] flex items-center justify-between"
                      >
                        <div>
                          <p className="font-mono font-bold text-[#181F4B]">
                            #{ord.orderNumber}
                          </p>
                          <p className="text-[10px] text-[#6B7088]">
                            {new Date(ord.createdAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#181F4B] font-albert">
                            Rp {ord.total.toLocaleString('id-ID')}
                          </p>
                          <span className="text-[10px] uppercase font-bold text-[#C9A876]">
                            {ord.orderStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6B7088] italic">Belum ada riwayat pesanan</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E7E8F0] flex justify-end">
              <button
                onClick={() => setInspectingCustomer(null)}
                className="px-4 py-2 bg-[#181F4B] text-[#C9A876] font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
