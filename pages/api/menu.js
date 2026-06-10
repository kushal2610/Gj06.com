import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('id, category, name, description, price, tag, available, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Menu fetch error:', error);
    return res.status(500).json({ error: 'Failed to load menu' });
  }

  // Return flat array — menu.html groups by item.category client-side
  return res.status(200).json(data);
}
