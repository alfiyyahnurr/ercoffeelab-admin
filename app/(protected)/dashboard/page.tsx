'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
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
} from 'lucide-react';

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
  dailySalesTrend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await apiFetch<DashboardStats>('/api/dashboard/stats');
      setStats(data);
    } catch (err: any) {
      if (!isBackground) {
        setError(err?.message || 'Gagal memuat statistik dashboard');
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats(false);

    // Auto background polling every 5 seconds for live dashboard updates
    const timer = setInterval(() => {
      fetchDashboardStats(true);
    }, 5000);

    return () => clearInterval(timer);
  }, [fetchDashboardStats]);

  const formatRupiah = (val: number) =>
    'Rp' + Math.max(0, Math.round(val || 0)).toLocaleString('id-ID');

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

  return (
    <div className="space-y-8 font-source">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-albert text-[#181F4B]">
            Executive Dashboard
          </h1>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Ringkasan omset harian, tren pesanan, dan monitoring operasi live.
          </p>
        </div>

        <button
          onClick={() => fetchDashboardStats()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F6F3EC] border border-[#E7E8F0] rounded-xl text-xs font-semibold text-[#181F4B] transition shadow-xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#C9A876] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
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
            <span>Pendapatan berhasil terverifikasi</span>
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
            Akumulasi transaksi hari ini
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

      {/* Main Grid: Trend Chart & Live Orders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E7E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold font-albert text-[#181F4B] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#C9A876]" />
                Tren Penjualan 7 Hari Terakhir
              </h2>
              <p className="text-xs text-[#6B7088] mt-0.5">
                Performa omset harian yang berhasil diproses
              </p>
            </div>
            <span className="text-xs font-semibold text-[#C9A876] bg-[#F6F3EC] px-3 py-1 rounded-full border border-[#C9A876]/30">
              Live Metrics
            </span>
          </div>

          {/* Visual Trend Bars */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 border-b border-[#E7E8F0] pb-2">
            {stats?.dailySalesTrend && stats.dailySalesTrend.length > 0 ? (
              stats.dailySalesTrend.map((item, idx) => {
                const maxRev = Math.max(...stats.dailySalesTrend.map((d) => d.revenue), 1);
                const heightPercent = Math.max(12, Math.round((item.revenue / maxRev) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Hover Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition bg-[#0E1230] text-white text-[10px] py-1 px-2 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                      {formatRupiah(item.revenue)} ({item.orders} order)
                    </div>

                    <div className="w-full max-w-[40px] bg-[#F6F3EC] group-hover:bg-[#C9A876]/30 rounded-t-xl overflow-hidden flex items-end h-full transition">
                      <div
                        className="w-full bg-gradient-to-t from-[#181F4B] to-[#3B4B8C] group-hover:from-[#C9A876] group-hover:to-[#b3915f] rounded-t-xl transition-all duration-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    <span className="text-[10px] font-medium text-[#6B7088] font-mono truncate">
                      {item.date?.slice(5)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#6B7088] space-y-2">
                <BarChart3 className="w-8 h-8 text-[#E7E8F0]" />
                <p>Belum ada tren data penjualan 7 hari terakhir.</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-[#6B7088]">
            <span>Data diperbarui secara realtime dari backend database.</span>
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
