import { join } from 'path';
import { readFile } from 'fs/promises';

import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

async function readLocalProducts() {
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'products.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
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
    publish: 'published',
    subDescription: p.subDescription || '',
  };
}

export async function getProducts() {
  const localProducts = (await readLocalProducts()).map(normalizeLocal);
  return { products: localProducts };
}

// ----------------------------------------------------------------------

export async function getProduct(id) {
  if (id?.startsWith('local-')) {
    const products = await readLocalProducts();
    const found = products.find((p) => p.id === id) || null;
    return { product: found ? normalizeLocal(found) : null };
  }

  const URL = id ? `${endpoints.product.details}?productId=${id}` : '';
  const res = await axios.get(URL);
  return res.data;
}
