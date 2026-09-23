'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import OrderAlertToast from '@/components/OrderAlertToast';
import { getStoredToken, parseStaffToken, StaffPayload, isTokenExpired, removeStoredToken, getMsUntilMidnight } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';
import { OutletProvider, useOutletContext } from '@/context/OutletContext';

function InnerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { staff, selectedOutletId, setSelectedOutletId } = useOutletContext();

  // Active Daily Session Lifecycle Manager (1-Day Midnight 00:00 Auto-Logout)
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

    const handleLogoutSessionExpired = () => {
      removeStoredToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    };

    // 1. Immediate validation check
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('ercoffeelab_staff_token') : null;
    if (!currentToken || isTokenExpired(currentToken)) {
      handleLogoutSessionExpired();
      return;
    }

    // 2. Schedule precise timer for midnight 00:00:00
    const msUntilMidnight = getMsUntilMidnight();
    const midnightTimer = setTimeout(() => {
      handleLogoutSessionExpired();
    }, msUntilMidnight);

    // 3. Periodic heartbeat interval check (every 30 seconds)
    const interval = setInterval(() => {
      const liveToken = typeof window !== 'undefined' ? localStorage.getItem('ercoffeelab_staff_token') : null;
      if (!liveToken || isTokenExpired(liveToken)) {
        handleLogoutSessionExpired();
      }
    }, 30000);

    // 4. Tab visibility change & window focus listener (waking up laptop or switching back to tab next day)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const liveToken = typeof window !== 'undefined' ? localStorage.getItem('ercoffeelab_staff_token') : null;
        if (!liveToken || isTokenExpired(liveToken)) {
          handleLogoutSessionExpired();
        }
      }
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);

    return () => {
      clearTimeout(midnightTimer);
      clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
    };
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
          collapsed ? 'pl-[70px]' : 'pl-[250px]'
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
