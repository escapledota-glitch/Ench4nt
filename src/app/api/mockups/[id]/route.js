import { NextResponse } from 'next/server';

import { supabaseServer } from 'src/lib/supabase-server';

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { garment_type, color_id, color_name, color_hex, front_url, back_url } = body;

    const { data, error } = await supabaseServer
      .from('mockup_variants')
      .update({ garment_type, color_id, color_name, color_hex, front_url, back_url: back_url || null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ mockup: data });
  } catch (err) {
    console.error('PUT /api/mockups/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const { error } = await supabaseServer.from('mockup_variants').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/mockups/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
