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

// GET /api/products — list all local products
export async function GET() {
  const products = await readProducts();
  return NextResponse.json({ products });
}

// DELETE /api/products — bulk delete by ids array { ids: ['id1','id2',...] }
export async function DELETE(req) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 });
    }
    const idSet = new Set(ids);
    const products = await readProducts();
    const filtered = products.filter((p) => !idSet.has(p.id));
    await writeProducts(filtered);
    return NextResponse.json({ deleted: ids.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 });
  }
}

// POST /api/products — create new product
export async function POST(req) {
  try {
    const data = await req.json();
    const products = await readProducts();

    const newProduct = {
      ...data,
      id: `local-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.unshift(newProduct);
    await writeProducts(products);

    return NextResponse.json({ product: newProduct });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
