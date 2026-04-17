import { NextResponse } from 'next/server';

import { supabaseServer } from 'src/lib/supabase-server';

// GET /api/products
export async function GET() {
  const { data, error } = await supabaseServer.from('products').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

// POST /api/products
export async function POST(req) {
  try {
    const data = await req.json();
    const images = (Array.isArray(data.images) ? data.images : [])
      .filter((img) => typeof img === 'string' && img.startsWith('http'));
    const { data: product, error } = await supabaseServer
      .from('products')
      .insert({ ...data, id: undefined, coverUrl: images[0] || '', images })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/products
export async function DELETE(req) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0)
      return NextResponse.json({ error: 'ids required' }, { status: 400 });
    const { error } = await supabaseServer.from('products').delete().in('id', ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: ids.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
