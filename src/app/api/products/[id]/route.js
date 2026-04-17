import { NextResponse } from 'next/server';

import { supabaseServer } from 'src/lib/supabase-server';

// GET /api/products/[id]
export async function GET(req, { params }) {
  const { id } = await params;
  const { data, error } = await supabaseServer.from('products').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product: data });
}

// PUT /api/products/[id]
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const images = (Array.isArray(data.images) ? data.images : [])
      .filter((img) => typeof img === 'string' && img.startsWith('http'));
    const { data: product, error } = await supabaseServer
      .from('products')
      .update({ ...data, coverUrl: images[0] || data.coverUrl || '', images, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const { error } = await supabaseServer.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
