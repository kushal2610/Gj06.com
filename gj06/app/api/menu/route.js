import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('id, category, name, description, price, tag, available, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }

  console.log('Raw data count:', data?.length);
  console.log('Sample:', data?.[0]);

  // Return raw data for debugging
  if (!data || data.length === 0) {
    return NextResponse.json({ categories: [], raw_count: data?.length, debug: 'No data returned' });
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
    if (!item.available) continue;
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