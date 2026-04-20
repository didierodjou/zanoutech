// src/staff/staff.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  // 1. Créer un membre du personnel
  async create(data: any) {
    const hashedPassword = await bcrypt.hash('staff123', 10);

    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    return this.prisma.$transaction(async (tx) => {
      // Créer le User
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          role: Role.STAFF,
        },
      });

      // Créer le profil Staff avec le champ phone
      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          jobTitle: data.jobTitle,
          department: data.department,
          hiringDate: new Date(data.hiringDate),
          phone: data.phone || null, // Maintenant le champ existe
        },
      });

      return staff;
    });
  }

  // 2. Lister tous les membres du personnel
  async findAll() {
    return this.prisma.staff.findMany({
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            salaries: true
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    });
  }

  // 3. Trouver un membre par ID
  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            salaries: true
          }
        }
      }
    });

    if (!staff) {
      throw new NotFoundException(`Membre du personnel avec ID ${id} non trouvé`);
    }

    return staff;
  }

  // 4. Détails complets d'un membre
  async getDetails(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            createdAt: true,
            isActive: true
          }
        },
        salaries: {
          orderBy: {
            month: 'desc'
          },
          take: 12
        }
      }
    });

    if (!staff) {
      throw new NotFoundException(`Membre du personnel avec ID ${id} non trouvé`);
    }

    // Calculer l'ancienneté
    const today = new Date();
    const hiringDate = new Date(staff.hiringDate);
    const yearsOfService = Math.floor((today.getTime() - hiringDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const monthsOfService = Math.floor((today.getTime() - hiringDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    return {
      ...staff,
      seniority: {
        years: yearsOfService,
        months: monthsOfService % 12,
        totalMonths: monthsOfService
      }
    };
  }

  // 5. Mettre à jour un membre
  async update(id: string, data: any) {
    const staff = await this.prisma.staff.findUnique({
      where: { id }
    });

    if (!staff) {
      throw new NotFoundException(`Membre du personnel avec ID ${id} non trouvé`);
    }

    return this.prisma.staff.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        jobTitle: data.jobTitle,
        department: data.department,
        hiringDate: data.hiringDate ? new Date(data.hiringDate) : undefined,
        phone: data.phone, // Maintenant le champ existe
      },
      include: {
        user: {
          select: { email: true }
        }
      }
    });
  }

  // 6. Supprimer un membre
  async delete(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            salaries: true
          }
        }
      }
    });

    if (!staff) {
      throw new NotFoundException(`Membre du personnel avec ID ${id} non trouvé`);
    }

    if (staff._count.salaries > 0) {
      throw new ConflictException('Impossible de supprimer un membre qui a des salaires enregistrés');
    }

    return this.prisma.staff.delete({
      where: { id }
    });
  }

  // 7. Rechercher des membres
  async search(query: string) {
    return this.prisma.staff.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { jobTitle: { contains: query, mode: 'insensitive' } },
          { department: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { user: { email: { contains: query, mode: 'insensitive' } } }
        ]
      },
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    });
  }

  // 8. Obtenir les statistiques par département
  async getDepartmentStats() {
    const staff = await this.prisma.staff.findMany({
      include: {
        salaries: true
      }
    });

    const stats = {};
    
    staff.forEach(member => {
      if (!stats[member.department]) {
        stats[member.department] = {
          count: 0,
          averageSalary: 0,
          totalSalary: 0,
          members: []
        };
      }
      
      stats[member.department].count++;
      
      if (member.salaries.length > 0) {
        const avgSalary = member.salaries.reduce((acc, s) => acc + s.netAmount, 0) / member.salaries.length;
        stats[member.department].totalSalary += avgSalary;
      }
      
      stats[member.department].members.push({
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        jobTitle: member.jobTitle
      });
    });

    Object.keys(stats).forEach(dept => {
      if (stats[dept].count > 0) {
        stats[dept].averageSalary = stats[dept].totalSalary / stats[dept].count;
      }
    });

    return stats;
  }

  // 9. Obtenir les membres par département
  async findByDepartment(department: string) {
    return this.prisma.staff.findMany({
      where: { department },
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    });
  }

  // 10. Obtenir les statistiques d'ancienneté
  async getSeniorityStats() {
    const staff = await this.prisma.staff.findMany();
    
    const today = new Date();
    const stats = {
      lessThan1Year: 0,
      between1And3Years: 0,
      between3And5Years: 0,
      between5And10Years: 0,
      moreThan10Years: 0,
      averageSeniority: 0
    };

    let totalYears = 0;

    staff.forEach(member => {
      const hiringDate = new Date(member.hiringDate);
      const years = (today.getTime() - hiringDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      
      totalYears += years;

      if (years < 1) stats.lessThan1Year++;
      else if (years < 3) stats.between1And3Years++;
      else if (years < 5) stats.between3And5Years++;
      else if (years < 10) stats.between5And10Years++;
      else stats.moreThan10Years++;
    });

    stats.averageSeniority = staff.length > 0 ? Number((totalYears / staff.length).toFixed(1)) : 0;

    return stats;
  }
}