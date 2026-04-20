// src/bulletins/bulletins.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulletinStatus, Period } from '@prisma/client';

@Injectable()
export class BulletinsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère tous les bulletins d'une classe pour une période donnée
   */
  async findByClass(classId: string, period: Period) {
    return this.prisma.bulletin.findMany({
      where: {
        period,
        student: {
          classId: classId
        }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNo: true,
            photo: true
          }
        }
      },
      orderBy: {
        student: {
          lastName: 'asc'
        }
      }
    });
  }

  /**
   * Met à jour l'appréciation d'un bulletin (Action du Prof Principal)
   */
  async updateAppreciation(id: string, appreciation: string) {
    const bulletin = await this.prisma.bulletin.findUnique({ where: { id } });
    if (!bulletin) throw new NotFoundException('Bulletin non trouvé');

    return this.prisma.bulletin.update({
      where: { id },
      data: { appreciation }
    });
  }

  /**
   * Valide un bulletin (Action du Prof Principal)
   * Change le statut de PENDING à VERIFIED
   */
  async verifyBulletin(id: string) {
    const bulletin = await this.prisma.bulletin.findUnique({ where: { id } });
    if (!bulletin) throw new NotFoundException('Bulletin non trouvé');

    return this.prisma.bulletin.update({
      where: { id },
      data: { status: BulletinStatus.VERIFIED }
    });
  }

  /**
   * Confirmation finale (Action de l'Admin/Directeur)
   * Change le statut de VERIFIED à CONFIRMED
   */
  async confirmBulletin(id: string) {
    return this.prisma.bulletin.update({
      where: { id },
      data: { status: BulletinStatus.CONFIRMED }
    });
  }

  /**
   * Validation en masse pour toute une classe
   */
  async verifyAllInClass(classId: string, period: Period) {
    return this.prisma.bulletin.updateMany({
      where: {
        period,
        status: BulletinStatus.PENDING,
        student: { classId }
      },
      data: { status: BulletinStatus.VERIFIED }
    });
  }
}