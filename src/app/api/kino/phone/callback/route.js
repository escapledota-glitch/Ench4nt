// Verify.MN-ийн мэдэгдэл (GET). Зөвхөн "хүлээж авлаа" гэж хариулна —
// жинхэнэ шалгалтыг /api/kino/phone (check) нь verify.mn-ээс шууд асууж хийдэг тул
// энэ хүсэлтэд итгэх шаардлагагүй.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ ok: true });
}

export function POST() {
  return Response.json({ ok: true });
}
