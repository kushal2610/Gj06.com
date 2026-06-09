import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — return VAPID public key to client
export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return NextResponse.json({ error: 'VAPID not configured' }, { status: 500 });
  }
  return NextResponse.json({ vapidPublicKey });
}

// POST — save push subscription
export async function POST(request) {
  try {
    const { endpoint, keys } = await request.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Upsert — avoid duplicates
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('Failed to save push subscription:', error);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Push subscription error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE — remove push subscription
export async function DELETE(request) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });

    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}