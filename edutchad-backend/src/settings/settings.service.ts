// src/settings/settings.service.ts
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-setting.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    let settings = await this.prisma.schoolSetting.findFirst();
    if (!settings) {
      settings = await this.prisma.schoolSetting.create({
        data: { schoolName: 'Mon École', currency: 'FCFA' },
      });
    }
    return settings;
  }

  // Sous-ensemble non sensible des réglages (nom + logo), utilisable sans
  // authentification : sidebar de tous les rôles, page de login, etc.
  async getPublicInfo() {
    const settings = await this.get();
    return {
      schoolName: settings.schoolName,
      logo: settings.logo,
    };
  }

  async update(dto: UpdateSettingsDto) {
    const existing = await this.prisma.schoolSetting.findFirst();
    if (!existing) {
      return this.prisma.schoolSetting.create({ data: dto as any });
    }
    return this.prisma.schoolSetting.update({
      where: { id: existing.id },
      data: dto,
    });
  }

  // ==================== SÉCURITÉ DU COMPTE ====================

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    return { success: true };
  }

  // ==================== GESTION DES ADMINISTRATEURS ====================

  async listAdmins() {
    return this.prisma.user.findMany({
      where: { role: Role.ADMIN, isDeleted: false },
      select: {
        id: true,
        email: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAdmin(email: string, temporaryPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, isDeleted: false },
    });
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

    const admin = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: Role.ADMIN,
        // L'admin devra définir son propre mot de passe à la première connexion.
        mustChangePassword: true,
      },
      select: { id: true, email: true, role: true, mustChangePassword: true, createdAt: true },
    });

    return admin;
  }
}