import { supabaseAdmin } from '../../lib/supabase';
import { sendReservationConfirmation } from '../../lib/email';
import { sendPushToAll } from '../../lib/push';

// Reservation lifecycle: pending (new) → confirmed | cancelled → completed
const SETTABLE_STATUSES = ['confirmed', 'cancelled', 'completed'];

function authorized(req) {
  const provided = req.headers['x-admin-password'];
  return process.env.ADMIN_PASSWORD && provided === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  // GET — list reservations for the kitchen dashboard (staff only)
  if (req.method === 'GET') {
    if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized' });

    const includeDone = req.query.all === '1'; // include cancelled/completed
    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);

    let query = supabaseAdmin
      .from('reservations')
      .select('*')
      .order('date', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!includeDone) query = query.in('status', ['pending', 'confirmed']);

    const { data, error } = await query;
    if (error) {
      console.error('Reservations fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch reservations' });
    }
    return res.status(200).json({ reservations: data });
  }

  // PATCH — confirm / cancel / complete a reservation (staff only)
  if (req.method === 'PATCH') {
    if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized' });

    const { id, status } = req.body || {};
    if (!id || !SETTABLE_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid id or status' });
    }

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Reservation update error:', error);
      return res.status(500).json({ error: 'Failed to update reservation' });
    }
    return res.status(200).json({ reservation: data });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customer_name, customer_phone, customer_email, date, time, guests, notes } = req.body;

  if (!customer_name || !customer_phone || !date || !time || !guests) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Guests may arrive as "8+" or "2 — A cozy duo" from the form — coerce to an int.
  const guestsNum = parseInt(String(guests), 10);
  if (!Number.isInteger(guestsNum) || guestsNum < 1) {
    return res.status(400).json({ error: 'Invalid number of guests' });
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .insert({ customer_name, customer_phone, customer_email: customer_email || null, date, time, guests: guestsNum, notes: notes || null, status: 'pending' })
    .select()
    .single();

  if (error) {
    console.error('Reservation insert error:', error);
    return res.status(500).json({ error: 'Failed to save reservation' });
  }

  // Push to kitchen
  await sendPushToAll({
    title: `Table reservation — ${guests} guests`,
    body: `${customer_name} · ${date} at ${time}`,
    tag: 'reservation',
  }).catch(err => console.error('Push error:', err));

  // Email to customer (if email provided)
  if (customer_email) {
    await sendReservationConfirmation({ customer_name, customer_email, date, time, guests, notes }).catch(err => console.error('Email error:', err));
  }

  return res.status(201).json({ success: true, id: data.id });
}
