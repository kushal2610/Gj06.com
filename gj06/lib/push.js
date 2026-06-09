import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function GET() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, category, name, description, price, tag, available, sort_order')
    .eq('available', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 });
  }

  // Group by category, preserving category order
  const CATEGORY_ORDER = [
    'Chai Ki Chuski',
    'Coffee',
    'Cold Brew',
    'English Tea',
    'Thickshakes',
    'Mocktails',
    'Juice & Cold Drinks',
    'Indian Street Style',
    'Snacks',
    'Pizza & Burger',
    'Sweet Goodies',
    'Combo Deals',
    'For Little Ones',
    'Add-Ons',
  ];

  const grouped = {};
  for (const item of data) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const categories = CATEGORY_ORDER.filter(cat => grouped[cat]).map(cat => ({
    name: cat,
    items: grouped[cat],
  }));

  return NextResponse.json({ categories }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}