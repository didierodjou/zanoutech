// src/upload/upload.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Type Multer défini localement — évite @types/multer
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

// ✅ SÉCURITÉ : on dérive l'extension depuis le MIME type (pas du nom de fichier)
// → empêche le spoofing "evil.php" avec MIME image/jpeg
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = join(process.cwd(), 'public', 'uploads', 'students');

  async saveStudentPhoto(file: MulterFile): Promise<string> {
    // ── Validation MIME ───────────────────────────────────────────────────────
    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) {
      // ✅ SÉCURITÉ + BUG : utilise BadRequestException (NestJS HTTP 400) au lieu
      //    de `throw new Error()` qui produisait une réponse 500 non structurée
      throw new BadRequestException(
        `Format non supporté : ${file.mimetype}. Formats acceptés : JPEG, PNG, WebP, GIF`,
      );
    }

    // ── Validation taille ─────────────────────────────────────────────────────
    if (file.size > MAX_SIZE) {
      throw new BadRequestException(
        `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum : 5 Mo`,
      );
    }

    // ── Création dossier ─────────────────────────────────────────────────────
    await mkdir(this.uploadDir, { recursive: true });

    // ── Nom de fichier sûr ───────────────────────────────────────────────────
    // ✅ SÉCURITÉ : UUID uniquement — aucune donnée du nom original dans le chemin
    //    (protège contre path traversal et injection de nom de fichier)
    const filename = `${uuidv4()}.${ext}`;
    const filepath = join(this.uploadDir, filename);

    // ── Écriture ──────────────────────────────────────────────────────────────
    await writeFile(filepath, file.buffer);
    this.logger.log(`Photo sauvegardée : ${filename}`);

    // ── Chemin public retourné ────────────────────────────────────────────────
    return `/uploads/students/${filename}`;
  }

  /**
   * Supprime une photo du disque à partir de son chemin public.
   * À appeler lors de la mise à jour ou suppression d'un élève.
   */
  async deletePhoto(publicPath: string): Promise<void> {
    if (!publicPath) return;

    // ✅ SÉCURITÉ : on n'accepte que les chemins dans notre dossier uploads
    if (!publicPath.startsWith('/uploads/students/')) {
      this.logger.warn(`Tentative de suppression d'un chemin non autorisé : ${publicPath}`);
      return;
    }

    const filename = publicPath.split('/').pop();
    if (!filename) return;

    const filepath = join(this.uploadDir, filename);
    if (existsSync(filepath)) {
      await unlink(filepath);
      this.logger.log(`Photo supprimée : ${filename}`);
    }
  }
}