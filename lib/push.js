import webpush from 'web-push';
import { supabaseAdmin } from './supabase.js';

// Configure VAPID once, lazily and defensively. Calling setVapidDetails at
// module load with an empty key throws ("No key set vapidDetails.publicKey"),
// which would crash EVERY route that imports this file (webhook, reservations).
let vapidReady = false;
function ensureVapid() {
  if (vapidReady) return true;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:hello@gj06.com.au',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
    vapidReady = true;
    return true;
  } catch (err) {
    console.error('VAPID config error — push disabled:', err.message);
    return false;
  }
}

export async function sendPushToAll(payload) {
  if (!ensureVapid()) return;

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
