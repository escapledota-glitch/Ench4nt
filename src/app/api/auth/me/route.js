import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'ench4nt-studio-secret-2026'
);

export async function GET(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    await jwtVerify(token, JWT_SECRET);

    return NextResponse.json({
      user: {
        id: 'ench4nt-admin',
        displayName: 'Ench4nt',
        email: 'admin@ench4nt.mn',
        role: 'admin',
        photoURL: '',
        isPublic: false,
      },
    });
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}
