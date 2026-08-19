'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import OrderAlertToast from '@/components/OrderAlertToast';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Instant client-side state initialization from stored token
  const [staff, setStaff] = useState<StaffPayload | null>(() => {
    if (typeof window !== 'undefined') {
      const token = getStoredToken();
      if (token) return parseStaffToken(token);
    }
    return null;
  });

  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const token = getStoredToken();
      if (token) {
        const parsed = parseStaffToken(token);
        if (parsed?.role === 'outlet_admin' && parsed?.outletId) {
          return parsed.outletId;
        }
      }
    }
    return null;
  });

  const syncStaffState = (token: string) => {
    const parsedStaff = parseStaffToken(token);
    setStaff(parsedStaff);
    if (parsedStaff) {
      if (parsedStaff.role === 'outlet_admin' && parsedStaff.outletId) {
        setSelectedOutletId(parsedStaff.outletId);
      } else if (parsedStaff.role === 'super_admin') {
        setSelectedOutletId(null);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    const token = getStoredToken();
    if (token) {
      syncStaffState(token);

      // Re-fetch fresh staff profile from database seamlessly in background
      apiFetch<{ staff: StaffPayload }>('/api/auth/me')
        .then((res) => {
          if (res?.staff) {
            setStaff(res.staff);
            if (res.staff.role === 'outlet_admin' && res.staff.outletId) {
              setSelectedOutletId(res.staff.outletId);
            }
          }
        })
        .catch(() => null);

      // Re-sync HttpOnly session cookie
      fetch('/api/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => null);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ercoffeelab_staff_token' && e.newValue) {
        syncStaffState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F5F9] font-source text-[#1E202B] relative selection:bg-[#C9A876]/20">
      {/* Dynamic Navigation Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        staff={staff}
      />

      {/* Main Container Wrapper */}
      <div
        className={`transition-all duration-300 ease-in-out flex flex-col min-h-screen ${
          collapsed ? 'pl-[72px]' : 'pl-[260px]'
        }`}
      >
        {/* Top Header Bar */}
        <Topbar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          staff={staff}
          selectedOutletId={selectedOutletId}
          onSelectOutlet={setSelectedOutletId}
        />

        {/* Live Order Toast Notification */}
        <OrderAlertToast outletId={selectedOutletId ?? staff?.outletId ?? null} />

        {/* Main Content Canvas with smooth transition */}
        <main
          className={`flex-1 p-6 bg-[#F4F5F9] overflow-x-hidden transition-opacity duration-300 ${
            mounted ? 'opacity-100' : 'opacity-80'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
