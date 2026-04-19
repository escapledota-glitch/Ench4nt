import { NextResponse } from 'next/server';

import { supabaseServer } from 'src/lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('mockup_variants')
      .select('*')
      .order('garment_type')
      .order('color_id');

    if (error) throw error;
    return NextResponse.json({ mockups: data || [] });
  } catch (err) {
    console.error('GET /api/mockups error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { garment_type, color_id, color_name, color_hex, front_url, back_url } = body;

    if (!garment_type || !color_id || !color_name || !color_hex || !front_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('mockup_variants')
      .insert([{ garment_type, color_id, color_name, color_hex, front_url, back_url: back_url || null }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ mockup: data });
  } catch (err) {
    console.error('POST /api/mockups error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
