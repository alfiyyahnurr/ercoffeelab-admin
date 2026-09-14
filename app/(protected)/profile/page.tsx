'use client';

import React from 'react';
import Link from 'next/link';
import { useOutletContext } from '@/context/OutletContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  User,
  Mail,
  Shield,
  Store,
  KeyRound,
  Info,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function ProfilePage() {
  const { staff, isSuperAdmin, activeOutletName, outlets } = useOutletContext();

  const assignedOutlet = outlets.find((o) => o.id === staff?.outletId);
  const locationDisplay = isSuperAdmin
    ? 'Kantor Pusat ERCoffeeLab (Semua Cabang)'
    : assignedOutlet
    ? `${assignedOutlet.name} (STORE)`
    : staff?.outletId
    ? `Outlet #${staff.outletId}`
    : 'Outlet Cabang';

  const roleDisplay = isSuperAdmin ? 'Super Administrator' : 'Admin Outlet';
  const initial = staff?.fullName ? staff.fullName.charAt(0).toUpperCase() : 'A';

  return (
    <div className="max-w-4xl mx-auto space-y-5 font-source animate-fade-in">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-[#E7E8F0] shadow-xs">
        <div>
          <h1 className="text-xl font-bold font-albert text-[#181F4B] flex items-center gap-2">
            <User className="w-5 h-5 text-[#C9A876]" />
            Profile & Account
          </h1>
          <p className="text-xs text-[#6B7088] mt-0.5">
            {roleDisplay} • ERCoffeeLab Enterprise CMS
          </p>
        </div>

        <div>
          <Badge variant={isSuperAdmin ? 'navy' : 'info'} dot>
            {roleDisplay}
          </Badge>
        </div>
      </div>

      {/* Main Profile Card (Read Only) */}
      <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
        {/* Card Header Title */}
        <div className="px-6 py-4 border-b border-[#E7E8F0] bg-[#FAFAFD]">
          <h2 className="text-sm font-bold font-albert text-[#181F4B]">
            Profil Akun Saya
          </h2>
          <p className="text-[11px] text-[#6B7088] mt-0.5">
            Informasi identitas akun dan penugasan operasional yang terdaftar di sistem.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Top User Header with Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-[#E7E8F0]">
            <div className="w-16 h-16 rounded-2xl bg-[#181F4B] text-[#C9A876] border-2 border-[#C9A876]/40 flex items-center justify-center font-bold font-albert text-2xl shadow-md shrink-0 select-none">
              <span>{initial}</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold font-albert text-[#181F4B]">
                  {staff?.fullName || 'Pengguna'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5EE] text-[#3E8A5A] border border-[#C4E6D1]">
                  Aktif (Active)
                </span>
              </div>
              <p className="text-xs text-[#6B7088] font-mono">
                {staff?.email || '-'}
              </p>
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#F4F5F9] text-[#181F4B] border border-[#E7E8F0]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C9A876]" />
                  <span>{roleDisplay}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields (Read-Only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Field: Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-albert text-[#181F4B] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C9A876]" />
                <span>Nama Lengkap</span>
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={staff?.fullName || ''}
                className="w-full px-3.5 py-2.5 bg-[#F8F9FD] border border-[#E7E8F0] rounded-xl text-xs font-bold text-[#181F4B] cursor-not-allowed select-all"
              />
            </div>

            {/* Field: Email / Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-albert text-[#181F4B] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#C9A876]" />
                <span>Email / Username</span>
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={staff?.email || ''}
                className="w-full px-3.5 py-2.5 bg-[#F8F9FD] border border-[#E7E8F0] rounded-xl text-xs font-mono font-bold text-[#181F4B] cursor-not-allowed select-all"
              />
            </div>

            {/* Field: Assigned Location / Outlet */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-albert text-[#181F4B] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#C9A876]" />
                <span>Lokasi Penugasan (Outlet Cabang)</span>
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={locationDisplay}
                className="w-full px-3.5 py-2.5 bg-[#F8F9FD] border border-[#E7E8F0] rounded-xl text-xs font-bold text-[#181F4B] cursor-not-allowed"
              />
            </div>

            {/* Field: Role & Permissions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-albert text-[#181F4B] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#C9A876]" />
                <span>Tingkat Hak Akses (Role)</span>
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={
                  isSuperAdmin
                    ? 'Super Administrator (Akses Penuh Semua Outlet)'
                    : 'Admin Outlet (Khusus Operasional Cabang)'
                }
                className="w-full px-3.5 py-2.5 bg-[#F8F9FD] border border-[#E7E8F0] rounded-xl text-xs font-bold text-[#181F4B] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Callout Notice Section */}
          <div className="p-4 rounded-xl bg-[#FEF6E6] border border-[#F7E5C4] text-xs text-[#181F4B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#C9A876] shrink-0 mt-0.5" />
              <p className="text-[11.5px] leading-relaxed text-[#181F4B]">
                Untuk mengubah kata sandi, nama lengkap, atau penugasan outlet akun ini, silakan kelola melalui menu <strong>Staff Accounts</strong> (oleh Super Admin) atau hubungi IT / Administrator Sistem.
              </p>
            </div>

            {isSuperAdmin && (
              <Link href="/staff" className="shrink-0">
                <Button
                  variant="gold"
                  size="sm"
                  icon={<ArrowRight className="w-3 h-3" />}
                >
                  Kelola Staf
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
