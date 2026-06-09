import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyAdmin(request) {
  const token = request.cookies.get('gj06-admin-token')?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// GET — list recent orders
export async function GET(request) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // optional filter
  const limit = parseInt(searchParams.get('limit') || '50');

  let query = supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  return NextResponse.json({ orders: data });
}

// PATCH — update order status
export async function PATCH(request) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status } = await request.json();

    const VALID_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!id || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({ order: data });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}