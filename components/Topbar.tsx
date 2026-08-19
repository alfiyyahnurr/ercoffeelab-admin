'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StaffPayload, removeStoredToken } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  Globe,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Coffee,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';

export interface OutletOption {
  id: number;
  name: string;
  code?: string;
  address?: string;
}

export interface OrderNotifItem {
  id: number | string;
  orderNumber: string;
  customerName?: string | null;
  outletName?: string | null;
  outletId?: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

interface TopbarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  staff: StaffPayload | null;
  selectedOutletId: number | null;
  onSelectOutlet: (outletId: number | null) => void;
}

// In-memory cache for outlets list to prevent redundant API calls during navigation
let cachedOutlets: OutletOption[] | null = null;

export default function Topbar({
  collapsed,
  onToggleCollapse,
  staff,
  selectedOutletId,
  onSelectOutlet,
}: TopbarProps) {
  const router = useRouter();
  const [outlets, setOutlets] = useState<OutletOption[]>(cachedOutlets || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Notifications State
  const [recentOrdersNotif, setRecentOrdersNotif] = useState<OrderNotifItem[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);

  const isSuperAdmin = staff?.role === 'super_admin';

  // Fetch outlets once for Super Admin switcher with in-memory caching
  useEffect(() => {
    if (isSuperAdmin) {
      if (cachedOutlets) {
        setOutlets(cachedOutlets);
        return;
      }

      apiFetch<{ data: OutletOption[] }>('/api/outlets')
        .then((res) => {
          let list: OutletOption[] = [];
          if (Array.isArray(res?.data)) {
            list = res.data;
          } else if (Array.isArray(res)) {
            list = res as any;
          }
          if (list.length > 0) {
            cachedOutlets = list;
            setOutlets(list);
          }
        })
        .catch(() => {
          const fallback = [
            { id: 1, name: 'ERCoffeeLab Bandung' },
            { id: 2, name: 'ERCoffeeLab Jakarta' },
            { id: 3, name: 'ERCoffeeLab Bekasi' },
          ];
          cachedOutlets = fallback;
          setOutlets(fallback);
        });
    }
  }, [isSuperAdmin]);

  // Fetch 5 Recent Transaction Notifications scoped strictly by Role & Outlet
  const fetchRecentNotifications = useCallback(async () => {
    setLoadingNotif(true);
    try {
      let queryPath = '/api/orders';
      if (isSuperAdmin && selectedOutletId) {
        queryPath += `?outletId=${selectedOutletId}`;
      }
      const res = await apiFetch<{ data: OrderNotifItem[] }>(queryPath);
      let list: OrderNotifItem[] = [];
      if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res)) list = res as any;

      const sliced = list.slice(0, 5);
      setRecentOrdersNotif(sliced);

      // Show red dot badge only if there are orders present
      if (sliced.length > 0) {
        setHasUnreadNotif(true);
      } else {
        setHasUnreadNotif(false);
      }
    } catch {
      setRecentOrdersNotif([]);
      setHasUnreadNotif(false);
    } finally {
      setLoadingNotif(false);
    }
  }, [isSuperAdmin, selectedOutletId]);

  // Initial fetch and auto-refresh on outlet change
  useEffect(() => {
    fetchRecentNotifications();
  }, [fetchRecentNotifications]);

  useEffect(() => {
    if (showNotifMenu) {
      fetchRecentNotifications();
    }
  }, [showNotifMenu, fetchRecentNotifications]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // Ignore network errors
    } finally {
      cachedOutlets = null;
      removeStoredToken();
      window.location.href = '/login';
    }
  };

  const assignedOutlet = outlets.find((o) => o.id === staff?.outletId) || {
    id: staff?.outletId || 1,
    name: staff?.outletId === 1 ? 'ERCoffeeLab Bandung' : 'Outlet Admin',
  };

  const activeOutletName = isSuperAdmin
    ? selectedOutletId
      ? outlets.find((o) => o.id === selectedOutletId)?.name || 'Outlet Selected'
      : 'Semua Outlet (Global)'
    : assignedOutlet.name;

  return (
    <header className="h-16 bg-white border-b border-[#E7E8F0] px-6 flex items-center justify-between sticky top-0 z-20 font-source shadow-xs">
      {/* Left Section: Sidebar Toggle + Brand Logo + Outlet Switcher */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-[#6B7088] hover:text-[#181F4B] hover:bg-[#F4F5F9] transition cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center hover:opacity-90 transition">
          <img
            src="/logo.png"
            alt="ER CoffeeLab"
            className="h-8 sm:h-9 w-auto max-w-[170px] object-contain shrink-0"
          />
        </Link>

        {/* Outlet Selector / Lock Badge */}
        {isSuperAdmin ? (
          <div className="relative flex items-center">
            <Globe className="w-4 h-4 absolute left-3.5 text-[#C9A876] pointer-events-none" />
            <select
              value={selectedOutletId ?? 'all'}
              onChange={(e) => {
                const val = e.target.value;
                onSelectOutlet(val === 'all' ? null : Number(val));
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
            <ChevronDown className="w-4 h-4 absolute right-3 text-[#6B7088] pointer-events-none" />
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#EDF0FA] border border-[#D2D9F3] text-xs font-semibold text-[#3B4B8C] font-albert shadow-xs">
            <Store className="w-4 h-4 text-[#3B4B8C]" />
            <span>{assignedOutlet.name}</span>
          </div>
        )}
      </div>

      {/* Right Section: Search + Notifications + Profile */}
      <div className="flex items-center gap-4">
        {/* Search Input Bar */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7088]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu, pesanan, outlet..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] placeholder-[#6B7088] focus:outline-none focus:border-[#C9A876] transition"
          />
        </div>

        {/* Notification Bell Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu((prev) => {
                const next = !prev;
                if (next) setHasUnreadNotif(false);
                return next;
              });
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-xl text-[#6B7088] hover:text-[#181F4B] hover:bg-[#F4F5F9] transition cursor-pointer"
            title="Notifikasi Pesanan"
          >
            <Bell className="w-5 h-5" />
            {hasUnreadNotif && recentOrdersNotif.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C9576B] ring-2 ring-white" />
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E7E8F0] rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 pb-3 border-b border-[#E7E8F0] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider font-albert text-[#181F4B] flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-[#C9A876]" />
                    Notifikasi Transaksi Baru
                  </h3>
                  <p className="text-[10px] text-[#6B7088] mt-0.5 truncate max-w-[240px]">
                    Cakupan: <strong className="text-[#181F4B]">{activeOutletName}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setShowNotifMenu(false)}
                  className="p-1 text-[#6B7088] hover:text-[#181F4B]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notification List Body */}
              <div className="divide-y divide-[#E7E8F0] max-h-72 overflow-y-auto">
                {loadingNotif ? (
                  <div className="py-8 text-center text-[#6B7088] text-xs">
                    <div className="w-5 h-5 border-2 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                    <span>Memuat transaksi terbaru...</span>
                  </div>
                ) : recentOrdersNotif.length > 0 ? (
                  recentOrdersNotif.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setShowNotifMenu(false);
                        router.push(`/orders/${ord.id}`);
                      }}
                      className="p-3.5 hover:bg-[#F6F3EC] transition cursor-pointer flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#F4F5F9] border border-[#E7E8F0] flex items-center justify-center text-[#181F4B] shrink-0 mt-0.5">
                        <ShoppingBag className="w-4 h-4 text-[#C9A876]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono font-bold text-xs text-[#181F4B] truncate">
                            #{ord.orderNumber}
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF5EE] text-[#3E8A5A] uppercase shrink-0">
                            {ord.orderStatus}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#6B7088] mt-0.5 truncate">
                          {ord.customerName || 'Pelanggan Walk-in'} •{' '}
                          <strong className="text-[#181F4B]">
                            Rp {ord.total.toLocaleString('id-ID')}
                          </strong>
                        </p>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6B7088]">
                          <Clock className="w-3 h-3 text-[#C9A876]" />
                          <span>{new Date(ord.createdAt).toLocaleTimeString('id-ID')}</span>
                          {ord.outletName && (
                            <>
                              <span>•</span>
                              <span className="truncate">{ord.outletName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-[#6B7088] text-xs space-y-1">
                    <ShoppingBag className="w-6 h-6 text-[#E7E8F0] mx-auto mb-1" />
                    <p className="font-semibold text-[#181F4B]">Belum Ada Pesanan Masuk</p>
                    <p className="text-[10px]">Transaksi terbaru akan muncul secara otomatis di sini.</p>
                  </div>
                )}
              </div>

              {/* Popover Footer Redirect Button */}
              <div className="p-2 border-t border-[#E7E8F0] bg-[#F4F5F9] rounded-b-2xl">
                <button
                  onClick={() => {
                    setShowNotifMenu(false);
                    router.push('/orders');
                  }}
                  className="w-full py-2 bg-white hover:bg-[#F6F3EC] border border-[#E7E8F0] hover:border-[#C9A876] text-[#181F4B] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs font-albert"
                >
                  <span>Lihat Semua Notifikasi dan Pesanan</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#C9A876]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Staff Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-[#F4F5F9] transition border border-transparent hover:border-[#E7E8F0] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#181F4B] to-[#3B4B8C] text-[#C9A876] flex items-center justify-center font-bold font-albert text-xs shadow-xs shrink-0">
              <span suppressHydrationWarning>{staff?.fullName?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="text-left hidden sm:flex flex-col justify-center min-h-[32px]">
              <p suppressHydrationWarning className="text-xs font-bold font-albert text-[#1E202B] leading-tight">
                {staff?.fullName}
              </p>
              <p suppressHydrationWarning className="text-[10px] text-[#6B7088] capitalize leading-tight">
                {staff?.role === 'super_admin' ? 'Super Admin' : staff?.role === 'outlet_admin' ? 'Outlet Admin' : ''}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7088]" />
          </button>

          {/* Profile Popover Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E7E8F0] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-[#E7E8F0]">
                <p className="text-xs font-bold font-albert text-[#1E202B]">
                  {staff?.fullName}
                </p>
                <p className="text-[10px] text-[#6B7088] truncate">{staff?.email}</p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-xs text-[#C9576B] hover:bg-[#FDF0F2] flex items-center gap-2 font-medium transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#C9576B]" />
                <span>Keluar Akun</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
