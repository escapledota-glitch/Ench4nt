import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

import { NextResponse } from 'next/server';

// Max 10MB per file
export const config = { api: { bodyParser: false } };

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files received' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'public', 'products');
    await mkdir(uploadDir, { recursive: true });

    const savedUrls = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Sanitize filename and make unique
      const ext = file.name.split('.').pop().toLowerCase();
      const baseName = file.name
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .slice(0, 40);
      const unique = `${baseName}-${Date.now()}.${ext}`;
      const filePath = join(uploadDir, unique);

      await writeFile(filePath, buffer);
      savedUrls.push(`/products/${unique}`);
    }

    return NextResponse.json({ urls: savedUrls });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
