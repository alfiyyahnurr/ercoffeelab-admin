'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useOutletContext } from '@/context/OutletContext';
import { getStoredRole } from '@/lib/auth';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmptyState } from '@/components/ui/Table';
import { Badge, OrderStatusBadge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import Pagination from '@/components/Pagination';
import {
  Coffee,
  Search,
  Eye,
  RefreshCw,
  ShoppingBag,
  Store,
  Globe,
  Clock,
  TrendingUp,
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
  { id: 'pending', label: 'Baru Masuk' },
  { id: 'preparing', label: 'Sedang Dibuat' },
  { id: 'ready', label: 'Siap Diambil atau Antar' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Batal' },
];

export default function OrdersPage() {
  const {
    staff,
    selectedOutletId,
    setSelectedOutletId,
    outlets,
    isSuperAdmin,
    activeOutletName,
  } = useOutletContext();
  const activeRole = staff?.role || getStoredRole();

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
      let endpoint =
        activeTab === 'all'
          ? '/api/orders'
          : `/api/orders?status=${activeTab}`;

      if (isSuperAdmin && selectedOutletId) {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}outletId=${selectedOutletId}`;
      }

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
  }, [activeTab, isSuperAdmin, selectedOutletId]);

  useEffect(() => {
    fetchOrders();
    setCurrentPage(1);
  }, [fetchOrders]);

  // Auto poll every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Filtered by Search Query
  const filteredOrders = orders.filter((ord) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ord.orderNumber.toLowerCase().includes(q) ||
      (ord.customerName && ord.customerName.toLowerCase().includes(q)) ||
      (ord.outletName && ord.outletName.toLowerCase().includes(q)) ||
      (ord.fulfillmentType && ord.fulfillmentType.toLowerCase().includes(q))
    );
  });

  // Calculate Metrics
  const totalAmount = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const preparingCount = orders.filter((o) => o.orderStatus === 'preparing').length;
  const readyCount = orders.filter((o) => o.orderStatus === 'ready').length;

  // Pagination Slice
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const formatRupiah = (val: number) =>
    'Rp' + Math.max(0, Math.round(val || 0)).toLocaleString('id-ID');

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const handleQuickStatus = async (orderId: string | number, newStatus: string) => {
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders(true);
    } catch (err: any) {
      alert(err?.message || 'Gagal memperbarui status pesanan');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 rounded-xl border border-[#E7E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold font-albert text-[#181F4B]">
              Live Orders dan Transaksi
            </h1>
            <Badge variant="navy" dot>
              {isSuperAdmin && !selectedOutletId ? 'Semua Outlet' : activeOutletName}
            </Badge>
          </div>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Pantau dan proses pesanan masuk dari pelanggan secara real-time.
          </p>
        </div>

        {/* Quick KPI Stat Chips */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F4F5F9] border border-[#E7E8F0] text-xs">
            <Clock className="w-3.5 h-3.5 text-[#C9A876]" />
            <span className="text-[#6B7088]">Sedang Dibuat:</span>
            <span className="font-bold text-[#181F4B] font-albert">{preparingCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F4F5F9] border border-[#E7E8F0] text-xs">
            <ShoppingBag className="w-3.5 h-3.5 text-[#3B4B8C]" />
            <span className="text-[#6B7088]">Siap:</span>
            <span className="font-bold text-[#181F4B] font-albert">{readyCount}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchOrders(false)}
            loading={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-[#E7E8F0] shadow-xs overflow-hidden">
        {/* Tabs Bar */}
        <div className="border-b border-[#E7E8F0] bg-[#FAFAFD] px-4 pt-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <Tabs
            tabs={STATUS_TABS.map((t) => ({
              ...t,
              count:
                t.id === 'all'
                  ? orders.length
                  : t.id === 'pending'
                  ? orders.filter((o) => ['pending', 'confirmed', 'paid', 'checkout'].includes((o.orderStatus || '').toLowerCase())).length
                  : t.id === 'ready'
                  ? orders.filter((o) => ['ready', 'on_delivery'].includes((o.orderStatus || '').toLowerCase())).length
                  : orders.filter((o) => (o.orderStatus || '').toLowerCase() === t.id).length,
            }))}
            activeTab={activeTab}
            onChange={(id) => {
              setActiveTab(id);
              setCurrentPage(1);
            }}
          />

          {/* Controls: Outlet Filter (Super Admin) + Search Box */}
          <div className="pb-2.5 md:pb-0 flex flex-wrap items-center gap-2 w-full md:w-auto">
            {isSuperAdmin && (
              <div className="w-full sm:w-44 shrink-0">
                <select
                  value={selectedOutletId ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedOutletId(val ? Number(val) : null);
                  }}
                  className="select text-xs h-8 bg-white border-[#E7E8F0] font-semibold text-[#181F4B]"
                >
                  <option value="">Semua Outlet</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="w-full sm:w-56">
              <Input
                placeholder="Cari order # atau nama..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                icon={<Search className="w-3.5 h-3.5" />}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Pelanggan</TableHead>
                {isSuperAdmin && !selectedOutletId && <TableHead>Outlet</TableHead>}
                <TableHead>Tipe Order</TableHead>
                <TableHead>Total Tagihan</TableHead>
                <TableHead>Status Bayar</TableHead>
                <TableHead>Status Pesanan</TableHead>
                <TableHead>Waktu Masuk</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isSuperAdmin && !selectedOutletId ? 9 : 8} className="py-4">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedOrders.length === 0 ? (
                <TableEmptyState
                  icon={<Coffee className="w-10 h-10 text-[#C9A876]" />}
                  title="Tidak ada pesanan ditemukan"
                  description={
                    searchQuery
                      ? `Tidak ada order yang cocok dengan "${searchQuery}"`
                      : 'Belum ada transaksi pada kategori status ini.'
                  }
                />
              ) : (
                paginatedOrders.map((order) => {
                  const statusNorm = (order.orderStatus || '').toLowerCase();
                  const isIncoming = ['pending', 'confirmed', 'paid', 'checkout'].includes(statusNorm);
                  const isPreparing = statusNorm === 'preparing';
                  const isReady = ['ready', 'on_delivery'].includes(statusNorm);

                  return (
                    <TableRow key={order.id}>
                      {/* Order Number */}
                      <TableCell className="font-bold font-albert text-[#181F4B]">
                        <Link
                          href={`/orders/${order.id}`}
                          className="hover:text-[#C9A876] hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <div className="font-semibold text-xs text-[#1E202B]">
                          {order.customerName || 'Tamu'}
                        </div>
                        {order.customerPhone && (
                          <div className="text-[11px] text-[#6B7088]">
                            {order.customerPhone}
                          </div>
                        )}
                      </TableCell>

                      {/* Outlet Name (Super Admin Global) */}
                      {isSuperAdmin && !selectedOutletId && (
                        <TableCell className="text-xs text-[#6B7088]">
                          {order.outletName || '-'}
                        </TableCell>
                      )}

                      {/* Fulfillment Type */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            order.fulfillmentType === 'delivery'
                              ? 'bg-[#EDF0FA] text-[#3B4B8C]'
                              : 'bg-[#FEF6E6] text-[#C9A876]'
                          }`}
                        >
                          {order.fulfillmentType === 'delivery' ? 'Pengantaran' : 'Pick Up'}
                        </span>
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="font-bold text-[#181F4B] font-albert text-xs">
                        {formatRupiah(order.total)}
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                            order.paymentStatus === 'paid'
                              ? 'text-[#3E8A5A]'
                              : 'text-[#C9576B]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              order.paymentStatus === 'paid'
                                ? 'bg-[#3E8A5A]'
                                : 'bg-[#C9576B]'
                            }`}
                          />
                          {order.paymentStatus === 'paid' ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </TableCell>

                      {/* Order Status Badge */}
                      <TableCell>
                        <OrderStatusBadge status={order.orderStatus} />
                      </TableCell>

                      {/* Created Date */}
                      <TableCell className="text-[11.5px] text-[#6B7088] whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isIncoming && (
                            <button
                              onClick={() => handleQuickStatus(order.id, 'preparing')}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#C9A876] text-[#181F4B] hover:bg-[#b89565] transition-colors"
                              title="Mulai Buat Pesanan"
                            >
                              Mulai Buat
                            </button>
                          )}

                          {isPreparing && (
                            <button
                              onClick={() => handleQuickStatus(order.id, order.fulfillmentType === 'delivery' ? 'on_delivery' : 'ready')}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#181F4B] text-white hover:bg-[#232c66] transition-colors"
                              title="Tandai Siap"
                            >
                              Tandai Siap
                            </button>
                          )}

                          {isReady && (
                            <button
                              onClick={() => handleQuickStatus(order.id, 'completed')}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#3E8A5A] text-white hover:bg-[#34744b] transition-colors"
                              title="Selesaikan Pesanan"
                            >
                              Selesaikan
                            </button>
                          )}

                          <Link href={`/orders/${order.id}`}>
                            <Button variant="secondary" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                              Detail
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {!loading && totalItems > 0 && (
          <div className="border-t border-[#E7E8F0] p-3 bg-[#FAFAFD]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
