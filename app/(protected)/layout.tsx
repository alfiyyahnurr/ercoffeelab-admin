'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import OrderAlertToast from '@/components/OrderAlertToast';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [staff, setStaff] = useState<StaffPayload | null>(null);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);

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
    const token = getStoredToken();
    if (token) {
      syncStaffState(token);

      // Re-sync HttpOnly session cookie on client mount to ensure server middleware stays 100% in sync
      fetch('/api/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => null);
    }

    // Multi-tab session synchronization listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ercoffeelab_staff_token' && e.newValue) {
        syncStaffState(e.newValue);
        fetch('/api/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: e.newValue }),
        }).catch(() => null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F5F9] font-source text-[#1E202B] relative">
      {/* Dynamic Navigation Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        staff={staff}
      />

      {/* Main Container Wrapper */}
      <div
        className={`transition-all duration-300 flex flex-col min-h-screen ${
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

        {/* Main Content Canvas */}
        <main className="flex-1 p-6 bg-[#F4F5F9] overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
