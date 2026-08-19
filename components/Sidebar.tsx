'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StaffPayload, removeStoredToken } from '@/lib/auth';
import {
  LayoutDashboard,
  Coffee,
  Tags,
  Package,
  Store,
  Ticket,
  Gift,
  Mail,
  UserCog,
  UserCheck,
  ChevronLeft,
  User,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  staff: StaffPayload | null;
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Live Orders',
    href: '/orders',
    icon: Coffee,
  },
  {
    label: 'Menu & Stok Outlet',
    href: '/menu',
    icon: Tags,
  },
  {
    label: 'Master Menu',
    href: '/products',
    icon: Package,
    superAdminOnly: true,
  },
  {
    label: 'Outlets Governance',
    href: '/outlets',
    icon: Store,
    superAdminOnly: true,
  },
  {
    label: 'Vouchers & Promo',
    href: '/vouchers',
    icon: Ticket,
    superAdminOnly: true,
  },
  {
    label: 'Loyalty & Rewards',
    href: '/loyalty',
    icon: Gift,
    superAdminOnly: true,
  },
  {
    label: 'Notifikasi & Log',
    href: '/notifications',
    icon: Mail,
    superAdminOnly: true,
  },
  {
    label: 'Staff Accounts',
    href: '/staff',
    icon: UserCog,
    superAdminOnly: true,
  },
  {
    label: 'Data Pelanggan',
    href: '/customers',
    icon: UserCheck,
    superAdminOnly: true,
  },
];

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  staff,
}: SidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = staff?.role === 'super_admin';

  const visibleMenuItems = MENU_ITEMS.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // Ignore network errors
    } finally {
      removeStoredToken();
      window.location.href = '/login';
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 bg-[#0E1230] border-r border-[#C9A876]/20 transition-all duration-300 flex flex-col font-source select-none ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Top User Profile Header Section */}
      <div className="h-16 border-b border-[#3B4B8C]/20 flex items-center px-4 shrink-0 bg-[#0E1230]">
        {collapsed ? (
          /* Mini Mode: Centered Avatar Button to expand */
          <button
            onClick={onToggleCollapse}
            className="w-10 h-10 mx-auto rounded-full bg-[#181F4B] border border-[#C9A876]/40 flex items-center justify-center text-[#C9A876] shadow-sm cursor-pointer hover:scale-105 transition"
            title={`${staff?.fullName || 'User'} (${staff?.role || 'super_admin'})`}
          >
            <User className="w-5 h-5" />
          </button>
        ) : (
          /* Full Mode: User Profile Badge */
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-[#181F4B] border border-[#C9A876]/40 flex items-center justify-center shrink-0 text-[#C9A876] shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold font-albert text-white truncate leading-tight">
                {staff?.fullName || 'Staff User'}
              </p>
              <p className="text-[11px] font-medium text-[#C9A876] truncate mt-0.5">
                {staff?.role || 'super_admin'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1.5 scrollbar-thin">
        {visibleMenuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center rounded-xl transition-all duration-200 font-medium text-sm group cursor-pointer border ${
                collapsed ? 'justify-center py-3 px-0' : 'gap-3.5 px-3.5 py-3 hover:translate-x-1.5'
              } ${
                isActive
                  ? 'bg-[#181F4B] text-[#C9A876] font-semibold shadow-md border-[#C9A876]/60'
                  : 'border-transparent text-[#6B7088] hover:text-[#C9A876] hover:bg-[#181F4B] hover:border-[#C9A876]/40 hover:shadow-md'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {/* Active Left Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#C9A876] rounded-r-full shadow-sm" />
              )}

              <Icon
                className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-[#C9A876]' : 'text-[#6B7088] group-hover:text-[#C9A876]'
                }`}
              />

              {!collapsed && (
                <span className="truncate font-albert text-xs tracking-wide">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Logout Button */}
      <div className="p-3 border-t border-[#3B4B8C]/20 bg-[#0E1230] shrink-0">
        <button
          onClick={handleLogout}
          className={`w-full relative flex items-center rounded-xl transition-all duration-200 font-medium text-sm text-[#C9576B] hover:bg-[#FDF0F2]/10 hover:text-red-400 border border-transparent hover:border-[#C9576B]/40 group cursor-pointer ${
            collapsed ? 'justify-center py-3 px-0' : 'gap-3.5 px-3.5 py-3'
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {!collapsed && (
            <span className="truncate font-albert text-xs font-bold tracking-wide">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
