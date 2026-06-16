import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
// Sender on the verified Resend domain. Override with FROM_EMAIL in Vercel.
const FROM = process.env.FROM_EMAIL || 'GJ 06 <orders@gj06.com.au>';

export async function sendOrderConfirmation({ customer_name, customer_email, items, total, pickup_time, order_id }) {
  const itemLines = items.map(i => `${i.qty}× ${i.name} — $${(i.price * i.qty).toFixed(2)}`).join('\n');

  await resend.emails.send({
    from: FROM,
    to: customer_email,
    subject: `Your GJ 06 order is confirmed! 🫖`,
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#0a0a0a;">
        <h1 style="font-size:32px;letter-spacing:.04em;margin-bottom:4px;">GJ 06</h1>
        <p style="opacity:.5;margin-top:0;">A Magical 2D Cafe &amp; Bakehouse · Sydney</p>
        <hr style="border:2px solid #0a0a0a;margin:20px 0;">
        <h2 style="font-size:20px;">Hi ${customer_name}, your order is confirmed! ✦</h2>
        <p><strong>Pickup time:</strong> ${pickup_time}</p>
        <p><strong>Order #:</strong> ${order_id ? String(order_id).slice(0,8).toUpperCase() : 'N/A'}</p>
        <hr style="border:1px solid #ddd;margin:16px 0;">
        <pre style="font-family:monospace;font-size:14px;line-height:1.8;">${itemLines}</pre>
        <hr style="border:1px solid #ddd;margin:16px 0;">
        <p style="font-size:18px;font-weight:bold;">Total: $${Number(total).toFixed(2)}</p>
        <p style="opacity:.6;font-size:13px;">See you soon! Your order will be ready at the pickup time. ✦</p>
      </div>
    `,
  });
}

export async function sendReservationConfirmation({ customer_name, customer_email, date, time, guests, notes }) {
  await resend.emails.send({
    from: FROM,
    to: customer_email,
    subject: `Table reserved at GJ 06 — ${date} ✦`,
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#0a0a0a;">
        <h1 style="font-size:32px;letter-spacing:.04em;margin-bottom:4px;">GJ 06</h1>
        <p style="opacity:.5;margin-top:0;">A Magical 2D Cafe &amp; Bakehouse · Sydney</p>
        <hr style="border:2px solid #0a0a0a;margin:20px 0;">
        <h2 style="font-size:20px;">Hi ${customer_name}, your table is reserved! ✦</h2>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Guests:</strong> ${guests}</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        <p style="opacity:.6;font-size:13px;">We'll call you to confirm shortly. See you soon! ✦</p>
      </div>
    `,
  });
}
