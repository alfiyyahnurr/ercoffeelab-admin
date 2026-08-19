import { NextResponse } from 'next/server';

/**
 * POST /api/set-session
 * Body: { token: string }
 * Sets the HttpOnly session cookie for server-side auth & middleware.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const token = body?.token;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token wajib diisi' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: 'session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal me-set session' },
      { status: 500 }
    );
  }
}
