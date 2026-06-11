import { stripe } from '../../lib/stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items, customer_name, customer_phone, customer_email, pickup_time } = req.body;

  if (!items?.length || !customer_name || !customer_phone || !customer_email || !pickup_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const base = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://gj06-com-nine.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(i => ({
        price_data: {
          currency: 'aud',
          product_data: { name: i.name },
          unit_amount: Math.round(Number(i.price) * 100),
        },
        quantity: i.qty,
      })),
      mode: 'payment',
      success_url: `${base}/order-confirmation.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout.html`,
      customer_email,
      metadata: {
        customer_name,
        customer_phone,
        customer_email,
        pickup_time,
        items: JSON.stringify(items),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
}
