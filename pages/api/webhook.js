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
    const orderId = session.metadata?.order_id || session.client_reference_id;

    if (!orderId) {
      console.error('Webhook: no order_id on session', session.id);
      return res.status(200).json({ received: true }); // nothing to reconcile; don't make Stripe retry
    }

    // Idempotent: only a row still 'pending' gets confirmed. Stripe retries become no-ops.
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'confirmed', stripe_payment_id: session.id })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      // No matching pending row → already processed (retry) OR genuinely missing.
      if (error.code === 'PGRST116') {
        return res.status(200).json({ received: true, alreadyProcessed: true });
      }
      console.error('Order confirm error:', error);
      return res.status(500).json({ error: 'Failed to confirm order' }); // let Stripe retry
    }

    // Push notification to kitchen
    await sendPushToAll({
      title: `New order — $${Number(order.total).toFixed(2)}`,
      body: `${order.customer_name} · Pickup: ${order.pickup_time}`,
      tag: 'new-order',
    }).catch(err => console.error('Push error:', err));

    // Confirmation email to customer
    await sendOrderConfirmation({
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      items: order.items,
      total: order.total,
      pickup_time: order.pickup_time,
      order_id: order.id,
    }).catch(err => console.error('Email error:', err));
  }

  return res.status(200).json({ received: true });
}
