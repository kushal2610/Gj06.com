import { stripe } from '../../lib/stripe';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items, customer_name, customer_phone, customer_email, pickup_time } = req.body;

  if (!items?.length || !customer_name || !customer_phone || !customer_email || !pickup_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // ── Validate cart against the database — never trust client prices ──
    // Collapse the cart by id and coerce/validate quantities.
    const qtyById = new Map();
    for (const i of items) {
      if (i?.id === undefined || i?.id === null) {
        return res.status(400).json({ error: 'Invalid cart item' });
      }
      const id = String(i.id);
      const qty = Number(i.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
        return res.status(400).json({ error: 'Invalid quantity for an item' });
      }
      qtyById.set(id, (qtyById.get(id) || 0) + qty);
    }

    const ids = [...qtyById.keys()];
    const { data: menuRows, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .select('id, name, price, available')
      .in('id', ids);

    if (menuError) {
      console.error('Menu lookup error:', menuError);
      return res.status(500).json({ error: 'Could not validate order' });
    }

    const menuById = new Map((menuRows || []).map(m => [String(m.id), m]));

    // Build trusted line items + order snapshot from DB prices.
    const orderItems = [];
    let total = 0;
    for (const [id, qty] of qtyById) {
      const m = menuById.get(id);
      if (!m) return res.status(400).json({ error: 'An item is no longer on the menu' });
      if (!m.available) return res.status(400).json({ error: `${m.name} is currently unavailable` });
      const price = Number(m.price);
      total += price * qty;
      orderItems.push({ id: m.id, name: m.name, price, qty });
    }

    total = Math.round(total * 100) / 100;

    // ── Create a pending order BEFORE payment ──
    // The webhook flips this to 'confirmed', so an order always exists for a paid session.
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name,
        customer_phone,
        customer_email,
        items: orderItems,
        total,
        pickup_time,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Pending order insert error:', orderError);
      return res.status(500).json({ error: 'Could not create order' });
    }

    const base = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gj06.com.au';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: orderItems.map(i => ({
        price_data: {
          currency: 'aud',
          product_data: { name: i.name },
          unit_amount: Math.round(i.price * 100),
        },
        quantity: i.qty,
      })),
      mode: 'payment',
      success_url: `${base}/order-confirmation.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout.html`,
      customer_email,
      client_reference_id: String(order.id),
      metadata: { order_id: String(order.id) },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
}
