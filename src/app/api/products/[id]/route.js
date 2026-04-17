import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';

import { NextResponse } from 'next/server';

const DB_PATH = join(process.cwd(), 'data', 'products.json');

async function readProducts() {
  try {
    const raw = await readFile(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeProducts(products) {
  await mkdir(join(process.cwd(), 'data'), { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(products, null, 2));
}

// GET /api/products/[id]
export async function GET(req, { params }) {
  const { id } = await params;
  const products = await readProducts();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ product });
}

// PUT /api/products/[id] — update product
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const products = await readProducts();
    const idx = products.findIndex((p) => p.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    products[idx] = { ...products[idx], ...data, id, updatedAt: new Date().toISOString() };
    await writeProducts(products);

    return NextResponse.json({ product: products[idx] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const products = await readProducts();
    const filtered = products.filter((p) => p.id !== id);

    await writeProducts(filtered);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
