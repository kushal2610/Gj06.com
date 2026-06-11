import webpush from 'web-push';
import { supabaseAdmin } from './supabase.js';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:hello@gj06.com.au',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function sendPushToAll(payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('*');
  if (!subs?.length) return;

  const message = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message,
      ).catch(async err => {
        // 410 Gone = subscription expired, remove it
        if (err.statusCode === 410) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
        throw err;
      })
    )
  );

  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed) console.warn(`Push: ${failed}/${subs.length} failed`);
}
