'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import Pagination from '@/components/Pagination';
import {
  Coffee,
  Search,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

export interface OrderItem {
  id: number | string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  outletName: string;
  fulfillmentType: 'pickup' | 'delivery';
  paymentMethodName?: string;
  subtotal: number;
  discount: number;
  serviceFee: number;
  total: number;
  paymentStatus: 'paid' | 'unpaid' | 'failed';
  orderStatus: string;
  createdAt: string;
}

const STATUS_TABS = [
  { id: 'all', label: 'Semua Status' },
  { id: 'pending', label: 'Pending' },
  { id: 'preparing', label: 'Diproses (Preparing)' },
  { id: 'ready', label: 'Siap Diambil (Ready)' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Batal' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchOrders = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);
    try {
      const endpoint =
        activeTab === 'all'
          ? '/api/orders'
          : `/api/orders?status=${activeTab}`;

      const res = await apiFetch<{ data: OrderItem[] }>(endpoint);
      if (Array.isArray(res?.data)) {
        setOrders(res.data);
      } else if (Array.isArray(res)) {
        setOrders(res as any);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      if (!isBackground) {
        setError(err?.message || 'Gagal memuat daftar pesanan');
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders(false);
    setCurrentPage(1);

    // Auto background polling every 5 seconds for incoming orders
    const timer = setInterval(() => {
      fetchOrders(true);
    }, 5000);

    return () => clearInterval(timer);
  }, [fetchOrders]);

  const formatRupiah = (val: number) =>
    'Rp' + Math.max(0, Math.round(val || 0)).toLocaleString('id-ID');

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending' || s === 'unpaid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF6E6] text-[#C9A876] border border-[#F7E5C4]">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    if (s === 'preparing' || s === 'processing' || s === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EDF0FA] text-[#3B4B8C] border border-[#D2D9F3]">
          <ShoppingBag className="w-3 h-3" />
          Diproses (Preparing)
        </span>
      );
    }
    if (s === 'ready') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF6E6] text-[#C9A876] border border-[#F7E5C4]">
          <CheckCircle2 className="w-3 h-3" />
          Siap Diambil (Ready)
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EAF5EE] text-[#3E8A5A] border border-[#C6E7D2]">
          <CheckCircle2 className="w-3 h-3" />
          Selesai
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FDF0F2] text-[#C9576B] border border-[#FAF1F3]">
        {status}
      </span>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      (order.customerPhone && order.customerPhone.includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 font-source">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-albert text-[#181F4B]">
            Daftar Pesanan Masuk (Real-Time)
          </h1>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Pantau dan kelola seluruh transaksi order pelanggan di outlet cabang secara otomatis.
          </p>
        </div>

        <button
          onClick={() => fetchOrders()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F6F3EC] border border-[#E7E8F0] hover:border-[#C9A876] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#C9A876] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#FDF0F2] border border-[#FAF1F3] text-xs text-[#C9576B] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Bar: Status Tabs & Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-albert transition whitespace-nowrap cursor-pointer hover:scale-[1.02] ${
                  isActive
                    ? 'bg-[#181F4B] text-[#C9A876] shadow-xs'
                    : 'text-[#6B7088] hover:bg-[#F4F5F9] hover:text-[#181F4B]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7088]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="No Order / Nama Pelanggan..."
            className="w-full pl-9 pr-4 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] placeholder-[#6B7088] focus:outline-none focus:border-[#C9A876] transition"
          />
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F6F3EC] border-b border-[#E7E8F0] text-[#6B7088] uppercase tracking-wider font-bold font-albert text-[11px]">
                <th className="py-3.5 px-4">No. Order</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Outlet</th>
                <th className="py-3.5 px-4">Tipe Fulfillment</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Pembayaran</th>
                <th className="py-3.5 px-4">Status Pesanan</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6B7088]">
                    <div className="w-6 h-6 border-2 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat pesanan...</span>
                  </td>
                </tr>
              ) : paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F4F5F9] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#181F4B]">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1E202B]">
                      {order.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7088]">
                      {order.outletName}
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#F4F5F9] text-[#6B7088] text-[10px] font-bold uppercase border border-[#E7E8F0]">
                        {order.fulfillmentType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold font-albert text-[#181F4B]">
                      {formatRupiah(order.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                          order.paymentStatus === 'paid'
                            ? 'bg-[#EAF5EE] text-[#3E8A5A]'
                            : 'bg-[#FDF0F2] text-[#C9576B]'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(order.orderStatus)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181F4B] text-[#C9A876] hover:bg-[#0E1230] font-semibold text-xs font-albert transition shadow-xs cursor-pointer hover:scale-105"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#6B7088]">
                    <Coffee className="w-10 h-10 text-[#E7E8F0] mx-auto mb-3" />
                    <p className="font-semibold text-sm font-albert text-[#1E202B]">
                      Tidak ada pesanan ditemukan
                    </p>
                    <p className="text-xs text-[#6B7088] mt-1">
                      Coba ubah kata kunci pencarian atau filter status pesanan.
                    </p>
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
          totalItems={filteredOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(num) => {
            setItemsPerPage(num);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
