'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useOutletContext } from '@/context/OutletContext';
import { getStoredRole } from '@/lib/auth';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmptyState } from '@/components/ui/Table';
import { Badge, OrderStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Coffee,
  ArrowRight,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Store,
  Globe,
  ChevronDown,
} from 'lucide-react';

interface TrendItem {
  date: string;
  displayLabel?: string;
  revenue: number;
  orders: number;
}

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  averageOrderValue: number;
  pendingActionOrders: number;
  recentOrders: Array<{
    id: number | string;
    orderNumber: string;
    customerName: string;
    outletName: string;
    total: number;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  dailySalesTrend: TrendItem[];
  activeOutletId?: number | null;
  activeOutletName?: string | null;
}

export default function DashboardPage() {
  const {
    staff,
    selectedOutletId,
    setSelectedOutletId,
    outlets,
    isSuperAdmin,
    activeOutletName,
  } = useOutletContext();
  const activeRole = staff?.role || getStoredRole();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Range Selector State
  const [selectedRange, setSelectedRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [appliedRange, setAppliedRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = `/api/dashboard/stats?range=${appliedRange}`;
      if (isSuperAdmin && selectedOutletId) {
        endpoint += `&outletId=${selectedOutletId}`;
      }
      const data = await apiFetch<DashboardStats>(endpoint);
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat statistik dashboard');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, selectedOutletId, appliedRange]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const formatRupiah = (val: number) =>
    'Rp' + Math.max(0, Math.round(val || 0)).toLocaleString('id-ID');

  const formatShortRupiah = (val: number) => {
    if (!val || val <= 0) return '';
    if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1).replace('.', ',') + 'M';
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1).replace('.', ',') + 'jt';
    if (val >= 1_000) return Math.round(val / 1_000) + 'rb';
    return val.toString();
  };

  const trendList = stats?.dailySalesTrend || [];
  const rawMaxRevenue = Math.max(...trendList.map((item) => item.revenue), 0);

  let baseStep = 50000;
  if (appliedRange === 'weekly') baseStep = 1000000;
  else if (appliedRange === 'monthly') baseStep = 5000000;
  else if (appliedRange === 'yearly') baseStep = 50000000;

  const stepCount = 4;
  let tickInterval = baseStep;

  if (rawMaxRevenue > 0) {
    const targetMax = rawMaxRevenue * 1.2;
    const rawInterval = targetMax / stepCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
    const residual = rawInterval / magnitude;
    if (residual <= 1) tickInterval = magnitude;
    else if (residual <= 2) tickInterval = 2 * magnitude;
    else if (residual <= 2.5) tickInterval = 2.5 * magnitude;
    else if (residual <= 5) tickInterval = 5 * magnitude;
    else tickInterval = 10 * magnitude;
  }

  const maxScale = Math.max(baseStep * stepCount, tickInterval * stepCount);
  const yTicks = [maxScale, maxScale * 0.75, maxScale * 0.5, maxScale * 0.25, 0];

  return (
    <div className="space-y-4 animate-fade-in max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E7E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold font-albert text-[#181F4B]">
              Executive Dashboard
            </h1>
            <Badge variant="navy" dot>
              {isSuperAdmin && !selectedOutletId ? 'Semua Outlet' : activeOutletName}
            </Badge>
          </div>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Ringkasan omset harian, performa pesanan, dan monitoring operasi live.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <div className="w-48 sm:w-56">
              <select
                value={selectedOutletId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedOutletId(val ? Number(val) : null);
                }}
                className="select text-xs h-8 bg-[#F4F5F9] border-[#E7E8F0] font-semibold text-[#181F4B]"
              >
                <option value="">Semua Outlet (Global)</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboardStats}
            loading={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Revenue */}
        <div className="bg-white p-4 rounded-xl border border-[#E7E8F0] shadow-xs flex flex-col justify-between hover:border-[#C9A876]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B7088] uppercase tracking-wider font-albert">
              Total Omset Hari Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF6E6] text-[#C9A876] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-albert text-[#181F4B]">
              {loading ? <Skeleton className="h-6 w-28" /> : formatRupiah(stats?.todayRevenue || 0)}
            </h3>
            <p className="text-[10.5px] text-[#3E8A5A] font-semibold mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3E8A5A]" />
              <span>Transaksi berstatus Lunas (Paid)</span>
            </p>
          </div>
        </div>

        {/* Card 2: Orders Count */}
        <div className="bg-white p-4 rounded-xl border border-[#E7E8F0] shadow-xs flex flex-col justify-between hover:border-[#C9A876]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B7088] uppercase tracking-wider font-albert">
              Total Pesanan Masuk
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EDF0FA] text-[#3B4B8C] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-albert text-[#181F4B]">
              {loading ? <Skeleton className="h-6 w-16" /> : `${stats?.todayOrders || 0} Order`}
            </h3>
            <p className="text-[10.5px] text-[#6B7088] font-medium mt-0.5">
              Pickup & Delivery gabungan
            </p>
          </div>
        </div>

        {/* Card 3: AOV */}
        <div className="bg-white p-4 rounded-xl border border-[#E7E8F0] shadow-xs flex flex-col justify-between hover:border-[#C9A876]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B7088] uppercase tracking-wider font-albert">
              Rata-rata Order (AOV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F4F5F9] text-[#181F4B] flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-albert text-[#181F4B]">
              {loading ? <Skeleton className="h-6 w-24" /> : formatRupiah(stats?.averageOrderValue || 0)}
            </h3>
            <p className="text-[10.5px] text-[#6B7088] font-medium mt-0.5">
              Rata-rata per tiket pesanan
            </p>
          </div>
        </div>

        {/* Card 4: Action Required */}
        <div className="bg-white p-4 rounded-xl border border-[#E7E8F0] shadow-xs flex flex-col justify-between hover:border-[#C9A876]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B7088] uppercase tracking-wider font-albert">
              Butuh Diproses (Live)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FDF0F2] text-[#C9576B] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-albert text-[#C9576B]">
              {loading ? <Skeleton className="h-6 w-16" /> : `${stats?.pendingActionOrders || 0} Order`}
            </h3>
            <p className="text-[10.5px] text-[#C9576B] font-semibold mt-0.5">
              Status Pending / Preparing
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart Card */}
      <div className="bg-white rounded-xl border border-[#E7E8F0] p-4.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7E8F0] pb-3 mb-4">
          <div>
            <h2 className="font-albert font-bold text-sm text-[#181F4B]">
              Grafik Tren Penjualan & Transaksi
            </h2>
            <p className="text-[11px] text-[#6B7088] mt-0.5">
              Visualisasi grafik omset dan volume pesanan berdasarkan rentang waktu.
            </p>
          </div>

          {/* Range Selector Pill Group */}
          <div className="flex items-center gap-1 bg-[#F4F5F9] p-1 rounded-lg border border-[#E7E8F0] self-start sm:self-auto">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setSelectedRange(mode);
                  setAppliedRange(mode);
                }}
                className={`px-3 py-1 text-xs font-bold font-albert rounded-md transition-all cursor-pointer ${
                  appliedRange === mode
                    ? 'bg-[#181F4B] text-[#C9A876] shadow-xs'
                    : 'text-[#6B7088] hover:text-[#181F4B]'
                }`}
              >
                {mode === 'daily'
                  ? 'Harian'
                  : mode === 'weekly'
                  ? 'Mingguan'
                  : mode === 'monthly'
                  ? 'Bulanan'
                  : 'Tahunan'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="relative pt-2 pb-2">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-[#C9A876] animate-spin" />
            </div>
          ) : trendList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-[#8B93B8]">
              <BarChart3 className="w-10 h-10 mb-2 opacity-50 text-[#C9A876]" />
              <p className="text-xs font-semibold text-[#181F4B]">Belum ada riwayat transaksi</p>
            </div>
          ) : (
            <div className="relative h-64 flex flex-col justify-between">
              {/* Y-Axis Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {yTicks.map((tick, i) => (
                  <div key={i} className="flex items-center w-full">
                    <span className="text-[10px] text-[#8B93B8] font-mono w-14 text-right pr-2 shrink-0">
                      {formatShortRupiah(tick)}
                    </span>
                    <div className="h-[1px] bg-[#F0F1F6] flex-1" />
                  </div>
                ))}
              </div>

              {/* Bar Columns Container */}
              <div className="relative h-full flex items-end justify-around pl-16 pr-4 pb-6 z-10">
                {trendList.map((item, idx) => {
                  const heightPercent = maxScale > 0 ? Math.min(100, (item.revenue / maxScale) * 100) : 0;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative max-w-[48px] px-1"
                    >
                      {/* Tooltip on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-[#0E1230] text-white text-[10.5px] py-1.5 px-2.5 rounded-lg whitespace-nowrap pointer-events-none shadow-lg z-30 border border-[#C9A876]/30">
                        <p className="font-bold font-albert text-[#C9A876]">{item.displayLabel || item.date}</p>
                        <p className="text-white mt-0.5">{formatRupiah(item.revenue)}</p>
                        <p className="text-[9.5px] text-[#8B93B8]">{item.orders} Order</p>
                      </div>

                      {/* Bar Fill */}
                      <div
                        style={{ height: `${Math.max(4, heightPercent)}%` }}
                        className="w-full rounded-t-md bg-gradient-to-t from-[#181F4B] to-[#C9A876] group-hover:from-[#0E1230] group-hover:to-[#DEBE91] transition-all duration-300 shadow-xs"
                      />

                      {/* X-Axis Label */}
                      <span className="absolute -bottom-5 text-[10px] font-semibold text-[#6B7088] truncate max-w-[48px]">
                        {item.displayLabel || item.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table Card */}
      <div className="bg-white rounded-xl border border-[#E7E8F0] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E7E8F0] bg-[#FAFAFD] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-albert font-bold text-xs text-[#181F4B] uppercase tracking-wider">
              5 Transaksi Terkini
            </h2>
            <Badge variant="navy">Live</Badge>
          </div>
          <Link href="/orders">
            <Button variant="ghost" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Lihat Semua Orders
            </Button>
          </Link>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Pelanggan</TableHead>
              {isSuperAdmin && !selectedOutletId && <TableHead>Outlet</TableHead>}
              <TableHead>Total Tagihan</TableHead>
              <TableHead>Status Bayar</TableHead>
              <TableHead>Status Order</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={isSuperAdmin && !selectedOutletId ? 7 : 6} className="py-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
              <TableEmptyState
                icon={<Coffee className="w-8 h-8 text-[#C9A876]" />}
                title="Belum ada transaksi hari ini"
                description="Pesanan baru akan otomatis muncul di sini."
              />
            ) : (
              stats.recentOrders.map((ord) => (
                <TableRow key={ord.id}>
                  <TableCell className="font-bold font-albert text-[#181F4B]">
                    <Link href={`/orders/${ord.id}`} className="hover:text-[#C9A876] hover:underline">
                      {ord.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-xs text-[#1E202B]">
                    {ord.customerName || 'Tamu (Guest)'}
                  </TableCell>
                  {isSuperAdmin && !selectedOutletId && (
                    <TableCell className="text-xs text-[#6B7088]">
                      {ord.outletName || '-'}
                    </TableCell>
                  )}
                  <TableCell className="font-bold text-[#181F4B] font-albert text-xs">
                    {formatRupiah(ord.total)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                        ord.paymentStatus === 'paid' ? 'text-[#3E8A5A]' : 'text-[#C9576B]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          ord.paymentStatus === 'paid' ? 'bg-[#3E8A5A]' : 'bg-[#C9576B]'
                        }`}
                      />
                      {ord.paymentStatus === 'paid' ? 'Lunas' : 'Unpaid'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={ord.orderStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/orders/${ord.id}`}>
                      <Button variant="secondary" size="sm" icon={<Eye className="w-3 h-3" />}>
                        Detail
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
