import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (str) => String(str ?? '').replace(/[&<>"']/g, c => ESC[c]);

export async function sendOrderConfirmation(order) {
  const itemsList = order.items
    .map(item => `• ${item.name} x${item.qty} — $${(item.price * item.qty).toFixed(2)}`)
    .join('\n');

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;">
      <div style="background: #0a0a0a; padding: 24px; text-align: center;">
        <h1 style="color: #fff; font-family: Arial, sans-serif; letter-spacing: 0.1em; margin: 0; font-size: 28px;">GJ 06</h1>
        <p style="color: #aaa; margin: 4px 0 0; font-size: 14px;">A Magical 2D Cafe & Bakehouse</p>
      </div>
      <div style="padding: 32px 24px; border: 3px solid #0a0a0a; border-top: none;">
        <h2 style="font-size: 22px; margin-bottom: 8px;">Order Confirmed ✦</h2>
        <p style="color: #555; margin-bottom: 24px;">Hi ${esc(order.customer_name)}, your order is confirmed and we&apos;re getting it ready!</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em;">Your Order</h3>
          <pre style="font-family: Georgia, serif; font-size: 15px; white-space: pre-wrap; margin: 0;">${itemsList}</pre>
          <div style="border-top: 2px solid #0a0a0a; margin-top: 16px; padding-top: 16px;">
            <strong style="font-size: 18px;">Total: $${order.total.toFixed(2)} AUD</strong>
          </div>
        </div>

        <table style="width: 100%; font-size: 15px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #555;">Pickup Time</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${order.pickup_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;">Order Reference</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 12px;">${order.stripe_payment_id}</td>
          </tr>
        </table>

        <div style="margin-top: 32px; padding: 16px; border: 2px dashed #0a0a0a; text-align: center; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #555;">Questions? Call us at <strong>+61 000 000 000</strong></p>
        </div>
      </div>
      <div style="padding: 16px 24px; text-align: center; font-size: 12px; color: #999;">
        GJ 06 · Sydney, Australia · gj06-com-nine.vercel.app
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'GJ 06 <orders@gj06.com.au>',
      to: order.customer_email,
      subject: `Order Confirmed ✦ GJ 06 — ${order.customer_name}`,
      html,
    });
  } catch (err) {
    console.error('Email send failed:', err);
    // Non-fatal — order is still saved
  }
}

export async function sendReservationConfirmation(reservation) {
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;">
      <div style="background: #0a0a0a; padding: 24px; text-align: center;">
        <h1 style="color: #fff; font-family: Arial, sans-serif; letter-spacing: 0.1em; margin: 0; font-size: 28px;">GJ 06</h1>
        <p style="color: #aaa; margin: 4px 0 0; font-size: 14px;">A Magical 2D Cafe & Bakehouse</p>
      </div>
      <div style="padding: 32px 24px; border: 3px solid #0a0a0a; border-top: none;">
        <h2 style="font-size: 22px; margin-bottom: 8px;">Reservation Received ✦</h2>
        <p style="color: #555; margin-bottom: 24px;">Hi ${esc(reservation.customer_name)}, we&apos;ve received your reservation request and will confirm shortly.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 15px; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #555;">Date</td><td style="text-align: right; font-weight: bold;">${reservation.date}</td></tr>
            <tr><td style="padding: 8px 0; color: #555;">Time</td><td style="text-align: right; font-weight: bold;">${reservation.time}</td></tr>
            <tr><td style="padding: 8px 0; color: #555;">Guests</td><td style="text-align: right; font-weight: bold;">${reservation.guests}</td></tr>
            ${reservation.notes ? `<tr><td style="padding: 8px 0; color: #555;">Notes</td><td style="text-align: right;">${esc(reservation.notes)}</td></tr>` : ''}
          </table>
        </div>

        <div style="padding: 16px; border: 2px dashed #0a0a0a; text-align: center; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #555;">We'll call <strong>${reservation.customer_phone}</strong> to confirm your booking.</p>
        </div>
      </div>
      <div style="padding: 16px 24px; text-align: center; font-size: 12px; color: #999;">
        GJ 06 · Sydney, Australia
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'GJ 06 <reservations@gj06.com.au>',
      to: reservation.customer_email,
      subject: `Reservation Request — GJ 06, ${reservation.date}`,
      html,
    });
  } catch (err) {
    console.error('Reservation email failed:', err);
  }
}