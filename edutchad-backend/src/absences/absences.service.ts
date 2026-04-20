// src/absences/absences.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AbsencesService {
  constructor(private prisma: PrismaService) {}

  // 1. Créer une absence
  async create(data: any) {
    // Vérifier si l'élève existe
    const student = await this.prisma.student.findUnique({
      where: { id: data.studentId }
    });

    if (!student) {
      throw new NotFoundException(`Élève avec ID ${data.studentId} non trouvé`);
    }

    return this.prisma.absence.create({
      data: {
        studentId: data.studentId,
        date: new Date(data.date),
        type: data.type,
        isJustified: data.isJustified || false,
        reason: data.reason || null
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            class: true
          }
        }
      }
    });
  }

  // 2. Lister toutes les absences
  async findAll() {
    return this.prisma.absence.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNo: true,
            class: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }

  // 3. Absences par élève
  async findByStudent(studentId: string) {
    return this.prisma.absence.findMany({
      where: { studentId },
      orderBy: {
        date: 'desc'
      }
    });
  }

  // 4. Absences par classe
  async findByClass(classId: string) {
    return this.prisma.absence.findMany({
      where: {
        student: {
          classId
        }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNo: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }

  // 5. Trouver une absence par ID
  async findOne(id: string) {
    const absence = await this.prisma.absence.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNo: true,
            class: true
          }
        }
      }
    });

    if (!absence) {
      throw new NotFoundException(`Absence avec ID ${id} non trouvée`);
    }

    return absence;
  }

  // 6. Mettre à jour une absence
  async update(id: string, data: any) {
    const absence = await this.prisma.absence.findUnique({
      where: { id }
    });

    if (!absence) {
      throw new NotFoundException(`Absence avec ID ${id} non trouvée`);
    }

    return this.prisma.absence.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        type: data.type,
        isJustified: data.isJustified,
        reason: data.reason
      },
      include: {
        student: true
      }
    });
  }

  // 7. Supprimer une absence
  async delete(id: string) {
    const absence = await this.prisma.absence.findUnique({
      where: { id }
    });

    if (!absence) {
      throw new NotFoundException(`Absence avec ID ${id} non trouvée`);
    }

    return this.prisma.absence.delete({
      where: { id }
    });
  }

  // 8. Statistiques des absences
  async getStats(period?: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(0); // Depuis le début
    }

    const absences = await this.prisma.absence.findMany({
      where: {
        date: {
          gte: startDate
        }
      },
      include: {
        student: {
          select: {
            class: true
          }
        }
      }
    });

    const total = absences.length;
    const justified = absences.filter(a => a.isJustified).length;
    const unJustified = total - justified;
    const retards = absences.filter(a => a.type === 'RETARD').length;

    // Par classe
    const byClass = absences.reduce((acc, absence) => {
      const className = absence.student?.class?.name || 'Non assigné';
      if (!acc[className]) {
        acc[className] = 0;
      }
      acc[className]++;
      return acc;
    }, {});

    return {
      total,
      justified,
      unJustified,
      retards,
      byClass,
      period: period || 'all'
    };
  }

  
}