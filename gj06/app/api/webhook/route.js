import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { sendOrderConfirmation } from '@/lib/email';
import { notifyOwnerNewOrder } from '@/lib/push';

// IMPORTANT: Stripe webhooks need the raw body, not parsed JSON
export const config = { api: { bodyParser: false } };

export async function POST(request) {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  let rawBody;

  try {
    rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const metadata = session.metadata || {};
      const items = JSON.parse(metadata.items || '[]');
      const total = session.amount_total / 100; // convert from cents

      // Save order to Supabase
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .insert({
          stripe_payment_id: session.payment_intent || session.id,
          customer_name: metadata.customer_name,
          customer_phone: metadata.customer_phone,
          customer_email: session.customer_email,
          items,
          total,
          pickup_time: metadata.pickup_time,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save order:', error);
        // Return 200 so Stripe doesn't retry — log the error
        return NextResponse.json({ received: true, error: 'DB save failed' });
      }

      // Fire notifications (non-blocking)
      const orderWithEmail = { ...order, customer_email: session.customer_email };
      await Promise.allSettled([
        sendOrderConfirmation(orderWithEmail),
        notifyOwnerNewOrder(order),
      ]);

    } catch (err) {
      console.error('Order processing error:', err);
    }
  }

  return NextResponse.json({ received: true });
}