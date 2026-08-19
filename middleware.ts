import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface JWTPayload {
  sub: number;
  type?: string;
  role: 'super_admin' | 'outlet_admin';
  outletId: number | null;
  email?: string;
  exp?: number;
}

const SUPER_ADMIN_ONLY_ROUTES = [
  '/staff',
  '/products',
  '/outlets',
  '/vouchers',
  '/loyalty',
  '/notifications',
];

/**
 * Safely parses JWT payload in Next.js Edge Runtime strictly from signed JWT claim.
 */
function parseJwtPayload(token: string): JWTPayload | null {
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

    // Strict role parsing from JWT claim
    const role: 'super_admin' | 'outlet_admin' =
      parsed.role === 'super_admin' ? 'super_admin' : 'outlet_admin';

    const rawOutletId = parsed.outletId !== undefined && parsed.outletId !== null ? Number(parsed.outletId) : null;

    return {
      sub: Number(parsed.sub),
      role,
      outletId: role === 'super_admin' ? null : (rawOutletId ?? 1),
      email: parsed.email || '',
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('session')?.value;

  let payload: JWTPayload | null = null;
  if (sessionToken) {
    payload = parseJwtPayload(sessionToken);

    // Check expiration if exp is present
    if (payload?.exp && payload.exp * 1000 < Date.now()) {
      payload = null;
    }
  }

  // 1. Root route '/' handling
  if (pathname === '/') {
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Auth routes (/login, /sso-callback): if already logged in, redirect to dashboard
  if (pathname === '/login' && payload) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Protected routes: check authentication
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/sso-callback') ||
    pathname.startsWith('/api/');

  if (!isPublicRoute && !payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Super-admin role restriction check
  if (payload) {
    const isSuperAdminOnly = SUPER_ADMIN_ONLY_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isSuperAdminOnly && payload.role !== 'super_admin') {
      // Outlet admin attempting to access super admin page -> redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
