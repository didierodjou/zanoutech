import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolYearsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.schoolYear.findMany({
      orderBy: { name: 'desc' },
    });
  }

  async findActive() {
    return this.prisma.schoolYear.findFirst({
      where: { isActive: true },
    });
  }

  async create(name: string, startDate: Date, endDate: Date) {
    // Désactiver l'ancienne année active si nécessaire
    if (startDate <= new Date() && endDate >= new Date()) {
      await this.prisma.schoolYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }
    return this.prisma.schoolYear.create({
      data: {
        name,
        startDate,
        endDate,
        isActive: startDate <= new Date() && endDate >= new Date(),
      },
    });
  }

  async setActive(id: string) {
    await this.prisma.schoolYear.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
    return this.prisma.schoolYear.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async delete(id: string) {
    const year = await this.prisma.schoolYear.findUnique({ where: { id } });
    if (!year) throw new NotFoundException('Année non trouvée');
    const hasClasses = await this.prisma.class.count({ where: { schoolYearId: id } });
    if (hasClasses > 0) {
      throw new BadRequestException('Impossible de supprimer une année qui contient des classes');
    }
    return this.prisma.schoolYear.delete({ where: { id } });
  }
}