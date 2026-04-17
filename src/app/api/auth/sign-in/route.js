import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'ench4nt-studio-secret-2026'
);

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    const adminUsername = process.env.ADMIN_USERNAME ?? 'Ench4nt';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Enkhnaran123';

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { message: 'Нэвтрэх нэр эсвэл нууц үг буруу байна.' },
        { status: 401 }
      );
    }

    const accessToken = await new SignJWT({ sub: 'ench4nt-admin', username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('3d')
      .sign(JWT_SECRET);

    return NextResponse.json({ accessToken });
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
