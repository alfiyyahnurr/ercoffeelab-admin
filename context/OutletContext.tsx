'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StaffPayload, getStoredToken, parseStaffToken } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';

export interface OutletOption {
  id: number;
  name: string;
  code?: string;
  address?: string;
}

interface OutletContextType {
  staff: StaffPayload | null;
  selectedOutletId: number | null;
  setSelectedOutletId: (id: number | null) => void;
  outlets: OutletOption[];
  isSuperAdmin: boolean;
  activeOutletName: string;
}

const OutletContext = createContext<OutletContextType>({
  staff: null,
  selectedOutletId: null,
  setSelectedOutletId: () => {},
  outlets: [],
  isSuperAdmin: true,
  activeOutletName: 'Semua Outlet (Global)',
});

let cachedOutlets: OutletOption[] | null = null;

export function OutletProvider({ children }: { children: React.ReactNode }) {
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

  const [outlets, setOutlets] = useState<OutletOption[]>(cachedOutlets || []);

  const isSuperAdmin = staff?.role === 'super_admin';

  // Fetch list of outlets for switcher
  useEffect(() => {
    if (cachedOutlets) {
      setOutlets(cachedOutlets);
      return;
    }

    apiFetch<{ data: OutletOption[] }>('/api/outlets')
      .then((res) => {
        let list: OutletOption[] = [];
        if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res)) list = res as any;

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
  }, []);

  const syncStaffState = useCallback((token: string) => {
    const parsedStaff = parseStaffToken(token);
    setStaff(parsedStaff);
    if (parsedStaff) {
      if (parsedStaff.role === 'outlet_admin' && parsedStaff.outletId) {
        setSelectedOutletId(parsedStaff.outletId);
      } else if (parsedStaff.role === 'super_admin') {
        setSelectedOutletId(null);
      }
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      syncStaffState(token);

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
    }
  }, [syncStaffState]);

  // Determine active outlet display name
  const activeOutletName = isSuperAdmin
    ? selectedOutletId
      ? outlets.find((o) => o.id === selectedOutletId)?.name || `Outlet #${selectedOutletId}`
      : 'Semua Outlet (Global)'
    : outlets.find((o) => o.id === (staff?.outletId ?? selectedOutletId))?.name ||
      (staff?.outletId === 1 ? 'ERCoffeeLab Bandung' : 'Outlet Cabang');

  return (
    <OutletContext.Provider
      value={{
        staff,
        selectedOutletId,
        setSelectedOutletId,
        outlets,
        isSuperAdmin,
        activeOutletName,
      }}
    >
      {children}
    </OutletContext.Provider>
  );
}

export function useOutletContext() {
  return useContext(OutletContext);
}
