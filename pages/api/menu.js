import { supabaseAdmin } from '../../lib/supabase';

// Category display order + icon mapping
const CATEGORY_META = {
  'Chai Ki Chuski':     { id: 'chai',         icon: '🫖' },
  'Coffee':             { id: 'coffee',        icon: '☕' },
  'Cold Brew':          { id: 'cold-brew',     icon: '🧊' },
  'English Tea':        { id: 'english-tea',   icon: '🫖' },
  'Thickshakes':        { id: 'thickshakes',   icon: '🥤' },
  'Mocktails':          { id: 'mocktails',     icon: '🍹' },
  'Juice & Cold Drinks':{ id: 'juices',        icon: '🥤' },
  'Indian Street Style':{ id: 'street',        icon: '🌶️' },
  'Snacks':             { id: 'snacks',        icon: '🥐' },
  'Pizza & Burger':     { id: 'pizza-burger',  icon: '🍕' },
  'Sweet Goodies':      { id: 'sweets',        icon: '🍰' },
  'Combo Deals':        { id: 'combos',        icon: '🤝' },
  'For Little Ones':    { id: 'kids',          icon: '🧒' },
  'Add-Ons':            { id: 'addons',        icon: '➕' },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('id, category, name, description, price, tag, available, sort_order')
    .eq('available', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Menu fetch error:', error);
    return res.status(500).json({ error: 'Failed to load menu' });
  }

  // Group rows by category, preserving the defined order
  const grouped = {};
  for (const item of data) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push({
      id: item.id,
      name: item.name,
      desc: item.description,   // menu.js reads item.desc
      price: item.price,
      tag: item.tag || '',
    });
  }

  const categoryOrder = Object.keys(CATEGORY_META);
  // Include any categories in the DB that aren't in our map (future-proof)
  const allCats = [...categoryOrder, ...Object.keys(grouped).filter(c => !CATEGORY_META[c])];

  const categories = allCats
    .filter(cat => grouped[cat])
    .map(cat => {
      const meta = CATEGORY_META[cat] || { id: cat.toLowerCase().replace(/\s+/g, '-'), icon: '🍽️' };
      return {
        id: meta.id,       // menu.js filters by cat.id
        name: cat,
        icon: meta.icon,
        items: grouped[cat],
      };
    });

  return res.status(200).json({
    currency: '$',
    note: 'Prices in AUD. Extra shot, syrups, different milks $0.60. Upsize $1.',
    categories,
  });
}
