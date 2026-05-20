// src/app/api/upload/student-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'students');
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: NextRequest) {
  try {
    // Ensure the upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    const formData = await req.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilisez JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Validate size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > MAX_SIZE_MB) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)` },
        { status: 400 }
      );
    }

    // Build unique filename
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${uuidv4()}.${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Write to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Return the public URL path (accessible via Next.js static serving)
    const publicPath = `/uploads/students/${filename}`;
    return NextResponse.json({ path: publicPath }, { status: 200 });

  } catch (error) {
    console.error('Erreur upload photo:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la photo" },
      { status: 500 }
    );
  }
}