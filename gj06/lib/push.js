import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@gj06.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function notifyOwnerNewOrder(order) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured — skipping push notification');
    return;
  }

  // Fetch all owner push subscriptions
  const { data: subscriptions, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');

  if (error || !subscriptions?.length) return;

  const payload = JSON.stringify({
    title: 'New Order ✦',
    body: `${order.customer_name} — $${Number(order.total).toFixed(2)} AUD (${order.pickup_time})`,
    url: '/admin',
  });

  await Promise.allSettled(
    subscriptions.map(({ endpoint, p256dh, auth }) =>
      webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, payload).catch(err => {
        console.error('Push send failed:', err);
      })
    )
  );
}
