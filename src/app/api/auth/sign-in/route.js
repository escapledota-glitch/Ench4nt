import crypto from 'crypto';
import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'ench4nt-studio-secret-2026'
);

// ----------------------------------------------------------------------
// Админы нууц үг.
// Код GitHub дээр нээлттэй тул нууц үгийг энд ЭНГИЙН ТЕКСТЭЭР бичихгүй —
// зөвхөн буцааж тайлах боломжгүй scrypt "хурууны хээ" (hash) хадгална.
// Vercel-д ADMIN_PASSWORD тохируулсан бол тэрийг ашиглана.
// ----------------------------------------------------------------------
const ADMIN_PASSWORD_HASH = 'scrypt$05f1cc88261ac1473fbde0c6d6b24dc2$4ed7712b7d82048632435dca0c19a96fee659cf0d0e99bf5bf4cc7d3f0237cef';

function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function checkPassword(password) {
  if (process.env.ADMIN_PASSWORD) return safeEqual(password, process.env.ADMIN_PASSWORD);
  const [, salt, hash] = ADMIN_PASSWORD_HASH.split('
  try {
    const { username, password } = await req.json();

    const adminUsername = process.env.ADMIN_USERNAME ?? 'Ench4nt';

    if (username !== adminUsername || !checkPassword(String(password ?? ''))) {
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
);
  const test = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 }).toString('hex');
  return safeEqual(test, hash);
}

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    const adminUsername = process.env.ADMIN_USERNAME ?? 'Ench4nt';

    if (username !== adminUsername || !checkPassword(String(password ?? ''))) {
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
