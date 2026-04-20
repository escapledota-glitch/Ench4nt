import { NextResponse } from 'next/server';

import { supabaseServer } from 'src/lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ orders: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { customer_name, customer_phone, garment_type, color, size, quantity, notes, design_url } = body;
    if (!customer_name || !customer_phone) {
      return NextResponse.json({ error: 'Нэр болон утасны дугаар шаардлагатай' }, { status: 400 });
    }
    const { data, error } = await supabaseServer
      .from('orders')
      .insert([{ customer_name, customer_phone, garment_type, color, size, quantity: quantity || 1, notes, design_url, status: 'pending' }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ order: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { ids } = await req.json();
    const { error } = await supabaseServer.from('orders').delete().in('id', ids);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
