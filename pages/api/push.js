import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  // GET — return VAPID public key
  if (req.method === 'GET') {
    return res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
  }

  // POST — save push subscription
  if (req.method === 'POST') {
    const { endpoint, p256dh, auth } = req.body;

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'Missing subscription fields' });
    }

    // Upsert by endpoint so re-subscribing doesn't duplicate
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({ endpoint, p256dh, auth }, { onConflict: 'endpoint' });

    if (error) {
      console.error('Push subscription save error:', error);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    return res.status(201).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
