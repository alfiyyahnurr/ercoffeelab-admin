'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useOutletContext } from '@/context/OutletContext';
import { getStoredRole } from '@/lib/auth';
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
  coffeeRevenue?: number;
  nonCoffeeRevenue?: number;
  foodRevenue?: number;
  otherRevenue?: number;
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

const CATEGORY_LEGENDS = [
  { key: 'coffee', label: 'Espresso Based', color: 'bg-[#0D8A73]', hex: '#0D8A73' },
  { key: 'nonCoffee', label: 'Non-Coffee', color: 'bg-[#10B981]', hex: '#10B981' },
  { key: 'food', label: 'Pastry & Food', color: 'bg-[#4F46E5]', hex: '#4F46E5' },
  { key: 'other', label: 'Penerimaan Lainnya', color: 'bg-[#F59E0B]', hex: '#F59E0B' },
];

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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <span className="badge badge-success">COMPLETED</span>;
      case 'preparing':
      case 'confirmed':
        return <span className="badge badge-warning">PREPARING</span>;
      case 'ready':
      case 'on_delivery':
        return <span className="badge badge-info font-bold">READY</span>;
      case 'cancelled':
        return <span className="badge badge-danger">CANCELLED</span>;
      default:
        return <span className="badge badge-info">{status?.toUpperCase() || 'PENDING'}</span>;
    }
  };

  const getPaymentBadge = (status: string) => {
    if (status === 'paid') {
      return <span className="text-[11px] font-semibold text-green">LUNAS (Paid)</span>;
    }
    return <span className="text-[11px] font-semibold text-red">UNPAID</span>;
  };

  // Compute dynamic Y-Axis scale for chart grid
  const trendList = stats?.dailySalesTrend || [];
  const maxRevenue = Math.max(
    ...trendList.flatMap((item) => [
      item.revenue,
      item.coffeeRevenue || 0,
      item.nonCoffeeRevenue || 0,
      item.foodRevenue || 0,
      item.otherRevenue || 0,
    ]),
    100000
  );

  // Generate 5 Y-Axis tick steps
  const yTicks = [
    maxRevenue,
    maxRevenue * 0.75,
    maxRevenue * 0.5,
    maxRevenue * 0.25,
    0,
  ];

  return (
    <div className="space-y-8 font-source">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E7E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-albert text-[#181F4B]">
              Executive Dashboard
            </h1>

            {/* Active Outlet Scope Badge */}
            {activeRole === 'super_admin' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F6F3EC] border border-[#C9A876]/40 text-xs font-bold text-[#181F4B] font-albert shadow-xs">
                <Globe className="w-3.5 h-3.5 text-[#C9A876]" />
                <span>{selectedOutletId ? activeOutletName : 'Global Overview'}</span>
              </span>
            ) : activeRole === 'outlet_admin' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EDF0FA] border border-[#D2D9F3] text-xs font-bold text-[#3B4B8C] font-albert shadow-xs">
                <Store className="w-3.5 h-3.5 text-[#3B4B8C]" />
                <span>Cabang Aktif: {activeOutletName}</span>
              </span>
            ) : (
              <div className="h-6 w-32 bg-[#F4F5F9] animate-pulse rounded-lg" />
            )}
          </div>

          <p className="text-xs text-[#6B7088] mt-1">
            Ringkasan omset harian, tren pesanan, dan monitoring operasi live.
          </p>
        </div>

        {/* Action Controls: Outlet Selector for Super Admin & Refresh Button */}
        <div className="flex flex-wrap items-center gap-3">
          {activeRole === 'super_admin' && (
            <div className="relative flex items-center">
              <Store className="w-4 h-4 absolute left-3 text-[#C9A876] pointer-events-none" />
              <select
                value={selectedOutletId ?? 'all'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedOutletId(val === 'all' ? null : Number(val));
                }}
                className="pl-9 pr-9 py-2 bg-[#F6F3EC] border border-[#C9A876]/40 rounded-xl text-xs font-semibold font-albert text-[#181F4B] focus:outline-none focus:border-[#C9A876] appearance-none cursor-pointer shadow-xs transition"
              >
                <option value="all">Semua Outlet (Global)</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 text-[#6B7088] pointer-events-none" />
            </div>
          )}

          <button
            onClick={fetchDashboardStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F6F3EC] border border-[#E7E8F0] rounded-xl text-xs font-semibold text-[#181F4B] transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C9A876] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#FDF0F2] border border-[#FAF1F3] text-xs text-[#C9576B] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Omset Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E8F0] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6B7088] uppercase tracking-wider">
              Omset Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#181F4B]/10 text-[#181F4B] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#181F4B]" />
            </div>
          </div>
          <div className="text-2xl font-bold font-albert text-[#181F4B] tracking-tight">
            {formatRupiah(stats?.todayRevenue || 0)}
          </div>
          <p className="text-[11px] text-[#6B7088] mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green" />
            <span>Pesanan lunas & selesai ({activeOutletName})</span>
          </p>
        </div>

        {/* KPI 2: Total Pesanan Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E8F0] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6B7088] uppercase tracking-wider">
              Total Pesanan
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#C9A876]/15 text-[#C9A876] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#C9A876]" />
            </div>
          </div>
          <div className="text-2xl font-bold font-albert text-[#181F4B] tracking-tight">
            {stats?.todayOrders || 0} <span className="text-xs font-normal text-[#6B7088]">pesanan</span>
          </div>
          <p className="text-[11px] text-[#6B7088] mt-1.5">
            Akumulasi transaksi selesai hari ini
          </p>
        </div>

        {/* KPI 3: Rata-Rata Nilai Order (AOV) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E8F0] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6B7088] uppercase tracking-wider">
              Rata-rata (AOV)
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#3B4B8C]/10 text-[#3B4B8C] flex items-center justify-center">
              <Coffee className="w-5 h-5 text-[#3B4B8C]" />
            </div>
          </div>
          <div className="text-2xl font-bold font-albert text-[#181F4B] tracking-tight">
            {formatRupiah(stats?.averageOrderValue || 0)}
          </div>
          <p className="text-[11px] text-[#6B7088] mt-1.5">
            Rata-rata pengeluaran per order
          </p>
        </div>

        {/* KPI 4: Pesanan Butuh Diproses */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E8F0] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6B7088] uppercase tracking-wider">
              Perlu Diproses
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#C9576B]/10 text-[#C9576B] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#C9576B]" />
            </div>
          </div>
          <div className="text-2xl font-bold font-albert text-[#C9576B] tracking-tight">
            {stats?.pendingActionOrders || 0} <span className="text-xs font-normal text-[#6B7088]">butuh aksi</span>
          </div>
          <p className="text-[11px] text-[#6B7088] mt-1.5">
            Antrean pembuatan minuman/makanan
          </p>
        </div>
      </div>

      {/* Main Grid: Time Performance Tracker & Quick Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Time Performance Tracker Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E7E8F0] shadow-xs flex flex-col justify-between min-h-[460px] max-h-[520px]">
          {/* Tracker Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold font-albert text-[#181F4B]">
                Time Performance Tracker
              </h2>
              <p className="text-xs text-[#6B7088] mt-0.5">
                Mode {appliedRange === 'daily' ? 'harian (7 hari)' : appliedRange === 'weekly' ? 'mingguan (4 minggu)' : appliedRange === 'monthly' ? 'bulanan (12 bulan)' : 'tahunan (5 tahun)'}: statistik omset per kategori produk + total ({activeOutletName}).
              </p>
            </div>

            {/* Range Controls: Dropdown + Terapkan Button */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <select
                  value={selectedRange}
                  onChange={(e) => setSelectedRange(e.target.value as any)}
                  className="pl-3 pr-8 py-2 bg-white border border-[#E7E8F0] rounded-xl text-xs font-medium text-[#181F4B] focus:outline-none focus:border-[#C9A876] appearance-none cursor-pointer shadow-2xs"
                >
                  <option value="daily">Harian (7 Hari)</option>
                  <option value="weekly">Mingguan (4 Minggu)</option>
                  <option value="monthly">Bulanan (12 Bulan)</option>
                  <option value="yearly">Tahunan (5 Tahun)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7088] pointer-events-none" />
              </div>

              <button
                onClick={() => setAppliedRange(selectedRange)}
                disabled={loading}
                className="px-4 py-2 bg-white hover:bg-[#F6F3EC] border border-[#E7E8F0] hover:border-[#C9A876] rounded-xl text-xs font-semibold text-[#6B7088] hover:text-[#181F4B] transition cursor-pointer shadow-2xs disabled:opacity-50"
              >
                Terapkan
              </button>
            </div>
          </div>

          {/* Category Legends (Matching Reference Image Style 1:1) */}
          <div className="flex flex-wrap items-center gap-5 mb-4 text-xs text-[#6B7088] font-medium">
            {CATEGORY_LEGENDS.map((cat) => (
              <div key={cat.key} className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-sm ${cat.color}`} />
                <span>{cat.label}</span>
              </div>
            ))}
          </div>

          {/* Main Chart Canvas with Fixed Dynamic Y-Axis Ticks & Multi-Bar Columns */}
          <div className="relative pt-4 pb-2 border-b border-[#E7E8F0] h-[270px] flex flex-col justify-end">
            {/* Background Y-Axis Ticks & Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pr-2">
              {yTicks.map((tick, idx) => (
                <div key={idx} className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-mono text-[#A0A5BD] w-20 shrink-0 truncate">
                    {formatRupiah(tick)}
                  </span>
                  <div className="w-full border-t border-[#E7E8F0]/70" />
                </div>
              ))}
            </div>

            {/* Multi-Bar Groups Rendering */}
            <div className="relative pl-20 h-56 flex items-end justify-between gap-2 overflow-x-auto scrollbar-none">
              {trendList.length > 0 ? (
                trendList.map((item, idx) => {
                  const coffeeVal = item.coffeeRevenue || 0;
                  const nonCoffeeVal = item.nonCoffeeRevenue || 0;
                  const foodVal = item.foodRevenue || 0;
                  const otherVal = item.otherRevenue || (item.revenue > 0 && !coffeeVal && !nonCoffeeVal && !foodVal ? item.revenue : 0);

                  const coffeeH = coffeeVal > 0 ? Math.max(6, Math.round((coffeeVal / maxRevenue) * 100)) : 0;
                  const nonCoffeeH = nonCoffeeVal > 0 ? Math.max(6, Math.round((nonCoffeeVal / maxRevenue) * 100)) : 0;
                  const foodH = foodVal > 0 ? Math.max(6, Math.round((foodVal / maxRevenue) * 100)) : 0;
                  const otherH = otherVal > 0 ? Math.max(6, Math.round((otherVal / maxRevenue) * 100)) : 0;

                  return (
                    <div key={idx} className="flex-1 h-full flex flex-col items-center justify-end group relative z-10">
                      {/* Hover Tooltip showing exact nominal */}
                      <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition duration-200 bg-[#0E1230] text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-2xl pointer-events-none whitespace-nowrap z-30 flex flex-col items-center">
                        <p className="font-bold text-white">{item.displayLabel || item.date}</p>
                        <p className="text-[#C9A876] font-mono font-bold mt-0.5">Total: {formatRupiah(item.revenue)} ({item.orders} order)</p>
                      </div>

                      {/* Multi-Bar Group Columns */}
                      <div className="w-full flex items-end justify-center gap-1 h-48 pb-1">
                        {/* Bar 1: Coffee */}
                        <div className="flex-1 max-w-[12px] flex flex-col items-center justify-end h-full relative group/bar">
                          {/* Nominal text shown on hover */}
                          {coffeeVal > 0 && (
                            <span className="absolute -top-5 text-[9px] font-bold font-mono text-[#0D8A73] opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20">
                              {formatShortRupiah(coffeeVal)}
                            </span>
                          )}
                          {coffeeH > 0 && (
                            <div
                              className="w-full bg-[#0D8A73] rounded-t-sm transition-all duration-500 hover:brightness-110"
                              style={{ height: `${coffeeH}%` }}
                            />
                          )}
                        </div>

                        {/* Bar 2: Non-Coffee */}
                        <div className="flex-1 max-w-[12px] flex flex-col items-center justify-end h-full relative group/bar">
                          {/* Nominal text shown on hover */}
                          {nonCoffeeVal > 0 && (
                            <span className="absolute -top-5 text-[9px] font-bold font-mono text-[#10B981] opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20">
                              {formatShortRupiah(nonCoffeeVal)}
                            </span>
                          )}
                          {nonCoffeeH > 0 && (
                            <div
                              className="w-full bg-[#10B981] rounded-t-sm transition-all duration-500 hover:brightness-110"
                              style={{ height: `${nonCoffeeH}%` }}
                            />
                          )}
                        </div>

                        {/* Bar 3: Food */}
                        <div className="flex-1 max-w-[12px] flex flex-col items-center justify-end h-full relative group/bar">
                          {/* Nominal text shown on hover */}
                          {foodVal > 0 && (
                            <span className="absolute -top-5 text-[9px] font-bold font-mono text-[#4F46E5] opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20">
                              {formatShortRupiah(foodVal)}
                            </span>
                          )}
                          {foodH > 0 && (
                            <div
                              className="w-full bg-[#4F46E5] rounded-t-sm transition-all duration-500 hover:brightness-110"
                              style={{ height: `${foodH}%` }}
                            />
                          )}
                        </div>

                        {/* Bar 4: Other */}
                        <div className="flex-1 max-w-[12px] flex flex-col items-center justify-end h-full relative group/bar">
                          {/* Nominal text shown on hover */}
                          {otherVal > 0 && (
                            <span className="absolute -top-5 text-[9px] font-bold font-mono text-[#F59E0B] opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20">
                              {formatShortRupiah(otherVal)}
                            </span>
                          )}
                          {otherH > 0 && (
                            <div
                              className="w-full bg-[#F59E0B] rounded-t-sm transition-all duration-500 hover:brightness-110"
                              style={{ height: `${otherH}%` }}
                            />
                          )}
                        </div>
                      </div>

                      {/* X-Axis Label */}
                      <span className="text-[11px] font-medium text-[#6B7088] mt-2 font-source truncate max-w-[55px] text-center">
                        {item.displayLabel || item.date?.slice(5)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#6B7088] space-y-2">
                  <BarChart3 className="w-8 h-8 text-[#E7E8F0]" />
                  <p>Belum ada data tren penjualan untuk periode ini.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-[#6B7088]">
            <span>Data diperbarui secara realtime dari database backend.</span>
            <Link
              href="/orders"
              className="text-[#181F4B] font-semibold hover:text-[#C9A876] transition flex items-center gap-1 font-albert"
            >
              <span>Lihat Semua Pesanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Recent Orders Widget (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold font-albert text-[#181F4B]">
                Pesanan Terbaru
              </h2>
              <Link
                href="/orders"
                className="text-xs text-[#C9A876] font-semibold hover:underline"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-xl bg-[#F4F5F9] border border-[#E7E8F0] hover:border-[#C9A876]/50 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="overflow-hidden text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-[#181F4B]">
                          {order.orderNumber}
                        </span>
                        {getStatusBadge(order.orderStatus)}
                      </div>
                      <p className="text-[#1E202B] font-medium mt-1 truncate">
                        {order.customerName}
                      </p>
                      <p className="text-[11px] text-[#6B7088]">
                        {formatRupiah(order.total)} • {getPaymentBadge(order.paymentStatus)}
                      </p>
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="p-2 rounded-lg bg-white border border-[#E7E8F0] text-[#6B7088] group-hover:text-[#181F4B] group-hover:border-[#C9A876] transition"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-[#6B7088]">
                  <Coffee className="w-8 h-8 text-[#E7E8F0] mx-auto mb-2" />
                  <p>Belum ada pesanan masuk.</p>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/orders"
            className="mt-4 w-full py-2.5 bg-[#F6F3EC] hover:bg-[#C9A876]/20 border border-[#C9A876]/40 text-[#181F4B] font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 font-albert"
          >
            <span>Buka Live Orders Table</span>
            <ArrowRight className="w-4 h-4 text-[#181F4B]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
