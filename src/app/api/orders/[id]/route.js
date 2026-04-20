import { NextResponse } from 'next/server';

import { supabaseServer } from 'src/lib/supabase-server';

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { data, error } = await supabaseServer
      .from('orders')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ order: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const { error } = await supabaseServer.from('orders').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
