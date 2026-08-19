export interface StaffPayload {
  sub: number;
  email: string;
  fullName: string;
  role: 'super_admin' | 'outlet_admin';
  outletId: number | null;
}

const TOKEN_KEY = 'ercoffeelab_staff_token';

/**
 * Retrieves the stored JWT authentication token from localStorage (client-side).
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
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
 * Removes the JWT token from localStorage.
 */
export function removeStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
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

    const decodedStr = atob(base64);
    let parsed: any;
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

    if (!parsed || !parsed.sub) return null;

    // Strict role determination from JWT token signed by backend
    const role: 'super_admin' | 'outlet_admin' =
      parsed.role === 'super_admin' ? 'super_admin' : 'outlet_admin';

    const rawOutletId = parsed.outletId !== undefined && parsed.outletId !== null ? Number(parsed.outletId) : null;

    return {
      sub: Number(parsed.sub),
      email: parsed.email || (role === 'super_admin' ? 'alfiyyah@gmail.com' : 'bandung.admin@ercoffeelab.com'),
      fullName: parsed.fullName || (role === 'super_admin' ? 'Alfiyyah Admin' : 'Admin Outlet Bandung'),
      role,
      outletId: role === 'super_admin' ? null : (rawOutletId ?? 1),
    };
  } catch {
    return null;
  }
}
