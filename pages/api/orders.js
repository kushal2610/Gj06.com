import { supabaseAdmin } from '../../lib/supabase';

// Order lifecycle: pending (unpaid) → confirmed (paid, via webhook)
//                  → preparing → ready → completed | cancelled
const KITCHEN_STATUSES = ['confirmed', 'preparing', 'ready'];
const SETTABLE_STATUSES = ['preparing', 'ready', 'completed', 'cancelled'];

function authorized(req) {
  const provided = req.headers['x-admin-password'];
  return process.env.ADMIN_PASSWORD && provided === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  if (!authorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET — list orders for the kitchen
  if (req.method === 'GET') {
    const status = req.query.status;                       // optional explicit filter
    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const includeDone = req.query.all === '1';             // include completed/cancelled

    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    } else if (!includeDone) {
      query = query.in('status', KITCHEN_STATUSES);        // active orders only by default
    }

    const { data, error } = await query;
    if (error) {
      console.error('Orders fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    return res.status(200).json({ orders: data });
  }

  // PATCH — advance an order's status
  if (req.method === 'PATCH') {
    const { id, status } = req.body || {};
    if (!id || !SETTABLE_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid id or status' });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Order update error:', error);
      return res.status(500).json({ error: 'Failed to update order' });
    }
    return res.status(200).json({ order: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
