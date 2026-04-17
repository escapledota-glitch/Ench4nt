import { supabaseServer } from 'src/lib/supabase-server';

import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

async function readLocalProducts() {
  const { data, error } = await supabaseServer.from('products').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

// ----------------------------------------------------------------------

function normalizeLocal(p) {
  const images = Array.isArray(p.images) ? p.images : [];
  return {
    ...p,
    coverUrl: images[0] || '',
    images,
    available: p.quantity ?? 99,
    colors: p.colors?.length ? p.colors : ['#000000'],
    sizes: p.sizes?.length ? p.sizes : ['XS', 'S', 'M', 'L', 'XL'],
    newLabel: p.newLabel ?? { enabled: false, content: '' },
    saleLabel: p.saleLabel ?? { enabled: false, content: '' },
    priceSale: p.priceSale ?? null,
    price: p.price ?? 0,
    totalRatings: p.totalRatings ?? 0,
    totalReviews: p.totalReviews ?? 0,
    reviews: p.reviews ?? [],
    ratings: p.ratings ?? [],
    inventoryType: (p.quantity ?? 99) > 0 ? 'in_stock' : 'out_of_stock',
    publish: p.publish || 'published',
    subDescription: p.subDescription || '',
  };
}

export async function getProducts() {
  const localProducts = (await readLocalProducts()).map(normalizeLocal);
  return { products: localProducts };
}

// ----------------------------------------------------------------------

export async function getProduct(id) {
  const { data } = await supabaseServer.from('products').select('*').eq('id', id).single();
  if (data) return { product: normalizeLocal(data) };

  const URL = id ? `${endpoints.product.details}?productId=${id}` : '';
  const res = await axios.get(URL);
  return res.data;
}
