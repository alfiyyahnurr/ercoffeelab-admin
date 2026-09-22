export interface StaffPayload {
  sub: number;
  email: string;
  fullName: string;
  role: 'super_admin' | 'outlet_admin';
  outletId: number | null;
  exp?: number;
}

const TOKEN_KEY = 'ercoffeelab_staff_token';

/**
 * Memeriksa apakah token JWT sudah expired (melewati jam 00:00 atau waktu exp).
 */
export function isTokenExpired(token?: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';

    const decodedRaw = atob(base64);
    const decodedStr = decodedRaw.replace(/\0/g, '').trim();
    let parsed: any = null;
    try {
      parsed = JSON.parse(decodedStr);
    } catch {
      const jsonPayload = decodeURIComponent(
        decodedStr
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      parsed = JSON.parse(jsonPayload);
    }

    if (!parsed || !parsed.exp) return false;
    // Expire if current time exceeds exp timestamp (in seconds)
    return Date.now() >= parsed.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Menghitung sisa milidetik menuju jam 00:00:00 pergantian hari berikutnya.
 */
export function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  return Math.max(0, midnight.getTime() - now.getTime());
}

/**
 * Retrieves the stored JWT authentication token from localStorage (client-side).
 * Otomatis menghapus token jika sudah melewati siklus harian (expired).
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  if (isTokenExpired(token)) {
    removeStoredToken();
    return null;
  }

  return token;
}

/**
 * Persists the JWT token into localStorage.
 */
export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Removes the JWT token from localStorage and clears role cookies.
 */
export function removeStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = 'ercoffeelab_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

/**
 * Synchronously retrieves stored staff role from cookies or localStorage (client-side).
 */
export function getStoredRole(): 'super_admin' | 'outlet_admin' | null {
  if (typeof window === 'undefined') return null;

  try {
    const cookies = document.cookie.split('; ');
    const roleCookie = cookies.find((c) => c.startsWith('ercoffeelab_role='));
    if (roleCookie) {
      const val = roleCookie.split('=')[1];
      if (val === 'super_admin' || val === 'outlet_admin') return val;
    }
  } catch {
    // Ignore cookie read error
  }

  const token = getStoredToken();
  if (token) {
    const parsed = parseStaffToken(token);
    return parsed?.role ?? null;
  }

  return null;
}

/**
 * Safely parses JWT staff payload strictly based on the token payload from backend database.
 */
export function parseStaffToken(token: string): StaffPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';

    const decodedRaw = atob(base64);
    // Remove null bytes and trailing whitespace that cause JSON.parse position errors
    const decodedStr = decodedRaw.replace(/\0/g, '').trim();

    let parsed: any = null;
    try {
      parsed = JSON.parse(decodedStr);
    } catch {
      try {
        const jsonPayload = decodeURIComponent(
          decodedStr
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        parsed = JSON.parse(jsonPayload);
      } catch {
        return null;
      }
    }

    if (!parsed || !parsed.sub) return null;

    // Strict role determination from JWT token signed by backend
    const role: 'super_admin' | 'outlet_admin' =
      parsed.role === 'super_admin' ? 'super_admin' : 'outlet_admin';

    const rawOutletId = parsed.outletId !== undefined && parsed.outletId !== null ? Number(parsed.outletId) : null;

    return {
      sub: Number(parsed.sub),
      email: parsed.email || (role === 'super_admin' ? 'admin@ercoffeelab.com' : 'bandung.admin@ercoffeelab.com'),
      fullName: parsed.fullName || (role === 'super_admin' ? 'Super Admin' : 'Admin Outlet Bandung'),
      role,
      outletId: role === 'super_admin' ? null : (rawOutletId ?? 1),
      exp: parsed.exp ? Number(parsed.exp) : undefined,
    };
  } catch {
    return null;
  }
}

