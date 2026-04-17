import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';

import { NextResponse } from 'next/server';

const DB_PATH = join(process.cwd(), 'data', 'products.json');

async function readProducts() {
  try {
    return JSON.parse(await readFile(DB_PATH, 'utf8'));
  } catch {
    return [];
  }
}

async function writeProducts(products) {
  await writeFile(DB_PATH, JSON.stringify(products, null, 2));
}

// POST /api/products/[id]/reviews
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { name, email, rating, review } = await req.json();

    const products = await readProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const newReview = {
      id: `review-${Date.now()}`,
      name,
      email,
      rating,
      comment: review,
      postedAt: new Date().toISOString(),
      avatarUrl: '',
      helpful: 0,
      isPurchased: false,
    };

    products[idx].reviews = [newReview, ...(products[idx].reviews || [])];

    // Recalculate average rating
    const allReviews = products[idx].reviews;
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    products[idx].totalRatings = Math.round(avg * 10) / 10;
    products[idx].totalReviews = (products[idx].totalReviews || 0) + 1;

    await writeProducts(products);
    return NextResponse.json({ review: newReview });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
