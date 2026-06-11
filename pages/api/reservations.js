import { supabaseAdmin } from '../../lib/supabase';
import { sendReservationConfirmation } from '../../lib/email';
import { sendPushToAll } from '../../lib/push';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customer_name, customer_phone, customer_email, date, time, guests, notes } = req.body;

  if (!customer_name || !customer_phone || !date || !time || !guests) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .insert({ customer_name, customer_phone, customer_email: customer_email || null, date, time, guests, notes: notes || null, status: 'pending' })
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
