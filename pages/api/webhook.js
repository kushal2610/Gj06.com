import { stripe } from '../../lib/stripe';
import { supabaseAdmin } from '../../lib/supabase';
import { sendOrderConfirmation } from '../../lib/email';
import { sendPushToAll } from '../../lib/push';

export const config = { api: { bodyParser: false } };

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const buf = await readBody(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: err.message });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { customer_name, customer_phone, customer_email, pickup_time, items: itemsJson } = session.metadata;
    const items = JSON.parse(itemsJson);
    const total = session.amount_total / 100;

    // Save order to Supabase
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        stripe_payment_id: session.id,
        customer_name,
        customer_phone,
        customer_email,
        items,
        total,
        pickup_time,
        status: 'confirmed',
      })
      .select()
      .single();

    if (error) console.error('Order insert error:', error);

    // Push notification to kitchen
    await sendPushToAll({
      title: `New order — $${total.toFixed(2)}`,
      body: `${customer_name} · Pickup: ${pickup_time}`,
      tag: 'new-order',
    }).catch(err => console.error('Push error:', err));

    // Confirmation email to customer
    await sendOrderConfirmation({
      customer_name,
      customer_email,
      items,
      total,
      pickup_time,
      order_id: order?.id,
    }).catch(err => console.error('Email error:', err));
  }

  return res.status(200).json({ received: true });
}
