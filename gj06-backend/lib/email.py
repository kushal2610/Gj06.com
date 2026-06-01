import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "orders@gj06.com.au")


async def send_order_confirmation(order: dict):
    """Send order confirmation email to customer after payment."""
    if not resend.api_key:
        print("RESEND_API_KEY not set — skipping email")
        return

    items_html = "".join(
        f"<tr><td style='padding:8px 0;'>{i.get('qty', 1)}x {i.get('name', '')}</td>"
        f"<td style='text-align:right;padding:8px 0;'>${i.get('price', 0) * i.get('qty', 1):.2f}</td></tr>"
        for i in order.get("items", [])
    )

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0a0a0a;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:36px;letter-spacing:2px;margin:0;">GJ 06</h1>
        <p style="color:#555;margin:4px 0;">A magical 2D cafe &amp; bakehouse</p>
      </div>

      <div style="border:3px solid #0a0a0a;border-radius:8px;padding:24px;margin-bottom:20px;">
        <h2 style="margin:0 0 16px;">Order Confirmed ✦</h2>
        <p>Hey {order['customer_name']}, your order is confirmed and we're getting it ready!</p>

        <table style="width:100%;margin:16px 0;border-top:2px solid #e0e0e0;padding-top:16px;">
          {items_html}
          <tr style="border-top:2px solid #0a0a0a;">
            <td style="padding:12px 0;font-weight:bold;">Total</td>
            <td style="text-align:right;font-weight:bold;">${order['total']:.2f}</td>
          </tr>
        </table>

        <div style="background:#f5f5f5;border-radius:6px;padding:16px;margin-top:16px;">
          <strong>Pickup Time:</strong> {order['pickup_time']}<br>
          <strong>Order ID:</strong> {order['id'][:8].upper()}
        </div>
      </div>

      <p style="color:#555;font-size:13px;text-align:center;">
        Questions? Call us on +61 000 000 000<br>
        Sydney, Australia
      </p>
    </body>
    </html>
    """

    try:
        resend.Emails.send({
            "from":    FROM_EMAIL,
            "to":      order["customer_email"],
            "subject": f"Order confirmed — GJ 06 ({order['id'][:8].upper()})",
            "html":    html,
        })
    except Exception as e:
        print(f"Email send failed: {e}")


async def send_reservation_confirmation(reservation: dict):
    """Send reservation confirmation email to customer."""
    if not resend.api_key:
        print("RESEND_API_KEY not set — skipping email")
        return

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0a0a0a;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:36px;letter-spacing:2px;margin:0;">GJ 06</h1>
        <p style="color:#555;margin:4px 0;">A magical 2D cafe &amp; bakehouse</p>
      </div>

      <div style="border:3px solid #0a0a0a;border-radius:8px;padding:24px;">
        <h2 style="margin:0 0 16px;">Reservation Received ✦</h2>
        <p>Hey {reservation['customer_name']}, we've received your reservation request!</p>
        <p>We'll call you on <strong>{reservation['customer_phone']}</strong> to confirm.</p>

        <div style="background:#f5f5f5;border-radius:6px;padding:16px;margin-top:16px;">
          <strong>Date:</strong> {reservation['date']}<br>
          <strong>Time:</strong> {reservation['time']}<br>
          <strong>Guests:</strong> {reservation['guests']}<br>
          {f"<strong>Notes:</strong> {reservation['notes']}<br>" if reservation.get('notes') else ""}
        </div>
      </div>

      <p style="color:#555;font-size:13px;text-align:center;margin-top:20px;">
        Questions? Call us on +61 000 000 000
      </p>
    </body>
    </html>
    """

    try:
        resend.Emails.send({
            "from":    FROM_EMAIL,
            "to":      reservation["customer_email"],
            "subject": "Reservation request received — GJ 06",
            "html":    html,
        })
    except Exception as e:
        print(f"Email send failed: {e}")