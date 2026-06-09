import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { order } = await req.json()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    const lineItems = order.items.map(item => ({
      price_data: {
        currency: 'aud',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: order.customer_email,
      metadata: {
        customer_name:  order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        pickup_time:    order.pickup_time,
        items:          JSON.stringify(order.items),
        total:          String(order.total),
      },
      success_url: `${siteUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/menu?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
