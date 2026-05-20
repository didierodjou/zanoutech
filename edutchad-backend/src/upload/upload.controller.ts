// src/upload/upload.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// ✅ FIX TYPE : import explicite depuis 'multer' au lieu du namespace global Express.Multer
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard) // ✅ SÉCURITÉ : toutes les routes d'upload nécessitent un JWT valide
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('student-photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 Mo — premier filtre au niveau Multer
      },
    }),
  )
  async uploadStudentPhoto(@UploadedFile() file: MulterFile) {
    // ✅ BUG CORRIGÉ : était `this.saveStudentPhoto(file)` — méthode inexistante sur le contrôleur
    // ✅ SÉCURITÉ : garde contre l'absence de fichier
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const path = await this.uploadService.saveStudentPhoto(file);
    return { path };
  }
}