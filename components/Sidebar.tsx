'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StaffPayload, removeStoredToken, getStoredRole } from '@/lib/auth';
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
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
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
  category?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    category: 'OPERASIONAL',
  },
  {
    label: 'Live Orders',
    href: '/orders',
    icon: Coffee,
    category: 'OPERASIONAL',
  },
  {
    label: 'Menu & Stok Outlet',
    href: '/menu',
    icon: Tags,
    category: 'OPERASIONAL',
  },
  {
    label: 'Master Menu',
    href: '/products',
    icon: Package,
    superAdminOnly: true,
    category: 'MANAJEMEN',
  },
  {
    label: 'Outlets Governance',
    href: '/outlets',
    icon: Store,
    superAdminOnly: true,
    category: 'MANAJEMEN',
  },
  {
    label: 'Vouchers & Promo',
    href: '/vouchers',
    icon: Ticket,
    superAdminOnly: true,
    category: 'MANAJEMEN',
  },
  {
    label: 'Loyalty & Rewards',
    href: '/loyalty',
    icon: Gift,
    superAdminOnly: true,
    category: 'MANAJEMEN',
  },
  {
    label: 'Notifikasi & Log',
    href: '/notifications',
    icon: Mail,
    superAdminOnly: true,
    category: 'MANAJEMEN',
  },
  {
    label: 'Staff Accounts',
    href: '/staff',
    icon: UserCog,
    superAdminOnly: true,
    category: 'MANAJEMEN',
  },
  {
    label: 'Data Pelanggan',
    href: '/customers',
    icon: UserCheck,
    superAdminOnly: true,
    category: 'MANAJEMEN',
  },
];

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  staff,
}: SidebarProps) {
  const pathname = usePathname();
  const role = staff?.role || getStoredRole();
  const isSuperAdmin = role === 'super_admin';

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
      className={`fixed top-0 left-0 bottom-0 z-30 bg-[#0E1230] border-r border-[#C9A876]/20 transition-all duration-300 flex flex-col font-source select-none shadow-xl ${
        collapsed ? 'w-[70px]' : 'w-[250px]'
      }`}
    >
      {/* Top Brand & Profile Header Section */}
      <div className="h-16 border-b border-[#232B66]/60 flex items-center justify-between px-3.5 shrink-0 bg-[#0A0D24]">
        {collapsed ? (
          <div className="w-full flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-xl bg-[#181F4B] border border-[#C9A876]/40 flex items-center justify-center text-[#C9A876] shadow-sm cursor-pointer hover:scale-105 transition"
              onClick={onToggleCollapse}
              title="Expand Sidebar"
            >
              <Coffee className="w-5 h-5 text-[#C9A876]" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="w-9 h-9 rounded-xl bg-[#181F4B] border border-[#C9A876]/40 flex items-center justify-center shrink-0 text-[#C9A876] shadow-sm">
              <Coffee className="w-5 h-5 text-[#C9A876]" />
            </div>
            <div className="overflow-hidden flex-1 min-h-[36px] flex flex-col justify-center">
              <p className="text-[13px] font-bold font-albert text-white tracking-wider truncate leading-tight">
                ER COFFEE LAB
              </p>
              <p className="text-[10px] font-semibold text-[#C9A876] uppercase tracking-widest truncate mt-0.5 leading-tight">
                {isSuperAdmin ? 'Enterprise CMS' : 'Outlet Panel'}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-6 h-6 rounded-md text-[#8B93B8] hover:text-[#C9A876] hover:bg-[#181F4B] flex items-center justify-center transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin">
        {visibleMenuItems.map((item, idx) => {
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          // Section Category Header (when expanded)
          const showCategoryHeader =
            !collapsed &&
            isSuperAdmin &&
            (idx === 0 || visibleMenuItems[idx - 1].category !== item.category);

          return (
            <React.Fragment key={item.href}>
              {showCategoryHeader && item.category && (
                <div className="px-3 pt-3 pb-1 text-[9.5px] font-bold text-[#8B93B8]/70 tracking-widest font-albert uppercase">
                  {item.category}
                </div>
              )}

              <Link
                href={item.href}
                className={`relative flex items-center rounded-lg transition-all duration-150 font-medium text-xs group cursor-pointer border ${
                  collapsed
                    ? 'justify-center py-2.5 px-0'
                    : 'gap-3 px-3 py-2.5 hover:translate-x-1'
                } ${
                  isActive
                    ? 'bg-[#181F4B] text-[#C9A876] font-bold border-[#C9A876]/40 shadow-xs'
                    : 'border-transparent text-[#8B93B8] hover:text-[#F6F3EC] hover:bg-[#181F4B]/50 hover:border-[#232B66]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {/* Active Left Indicator Pill */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#C9A876] rounded-r-full shadow-xs" />
                )}

                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                    isActive ? 'text-[#C9A876]' : 'text-[#8B93B8] group-hover:text-[#C9A876]'
                  }`}
                />

                {!collapsed && (
                  <span className="truncate font-albert text-[12px]">
                    {item.label}
                  </span>
                )}
              </Link>
            </React.Fragment>
          );
        })}
      </div>

      {/* User Info & Logout Footer Section */}
      <div className="p-2.5 border-t border-[#232B66]/60 bg-[#0A0D24] shrink-0 space-y-1.5">
        {!collapsed && staff && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-[#181F4B]/40 border border-[#232B66]/40">
            <div className="w-7 h-7 rounded-full bg-[#181F4B] border border-[#C9A876]/30 flex items-center justify-center shrink-0 text-[#C9A876]">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[11.5px] font-bold text-white font-albert truncate leading-tight">
                {staff.fullName}
              </p>
              <p className="text-[10px] text-[#C9A876] truncate font-medium mt-0.5 leading-tight">
                {staff.role}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className={`w-full relative flex items-center rounded-lg transition-all duration-150 text-xs font-semibold text-[#C9576B] hover:bg-[#C9576B]/10 hover:text-red-300 border border-transparent hover:border-[#C9576B]/30 group cursor-pointer ${
            collapsed ? 'justify-center py-2 px-0' : 'gap-2.5 px-3 py-2'
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
          {!collapsed && (
            <span className="truncate font-albert text-[11.5px]">
              Keluar Sistem
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
