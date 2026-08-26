'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import OrderAlertToast from '@/components/OrderAlertToast';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';
import { OutletProvider, useOutletContext } from '@/context/OutletContext';

function InnerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { staff, selectedOutletId, setSelectedOutletId } = useOutletContext();

  useEffect(() => {
    setMounted(true);
    const token = getStoredToken();
    if (token) {
      fetch('/api/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => null);
    }
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

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OutletProvider>
      <InnerLayout>{children}</InnerLayout>
    </OutletProvider>
  );
}
