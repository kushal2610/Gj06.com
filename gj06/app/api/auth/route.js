import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ ok: true });

    // Set HttpOnly cookie
    response.cookies.set('gj06-admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('gj06-admin-token');
  return response;
}