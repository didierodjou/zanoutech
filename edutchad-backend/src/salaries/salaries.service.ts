// src/salaries/salaries.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalariesService {
  constructor(private prisma: PrismaService) {}

  // 1. Créer un nouveau paiement
  async create(data: any) {
    // Calculer le net
    const netAmount = Number(data.baseAmount) + Number(data.bonuses || 0) - Number(data.deductions || 0);

    // Préparer les données selon le type de bénéficiaire
    const salaryData: any = {
      month: new Date(data.month),
      baseAmount: Number(data.baseAmount),
      bonuses: Number(data.bonuses || 0),
      deductions: Number(data.deductions || 0),
      netAmount,
      isPaid: false,
      paymentDate: new Date(),
    };

    // Ajouter la relation selon le type
    if (data.beneficiaryType === 'teacher' && data.beneficiaryId) {
      salaryData.teacher = {
        connect: { id: data.beneficiaryId }
      };
    } else if (data.beneficiaryType === 'staff' && data.beneficiaryId) {
      salaryData.staff = {
        connect: { id: data.beneficiaryId }
      };
    }

    return this.prisma.salary.create({
      data: salaryData,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: true
          }
        }
      }
    });
  }

  // 2. Lister tous les paiements
  async findAll() {
    return this.prisma.salary.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });
  }

  // 3. Trouver un paiement par ID
  async findOne(id: string) {
    const salary = await this.prisma.salary.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: true
          }
        }
      }
    });

    if (!salary) {
      throw new NotFoundException(`Salaire avec ID ${id} non trouvé`);
    }

    return salary;
  }

  // 4. Paiements par professeur
  async findByTeacher(teacherId: string) {
    return this.prisma.salary.findMany({
      where: { teacherId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        month: 'desc'
      }
    });
  }

  // 5. Paiements par personnel
  async findByStaff(staffId: string) {
    return this.prisma.salary.findMany({
      where: { staffId },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true
          }
        }
      },
      orderBy: {
        month: 'desc'
      }
    });
  }

  // 6. Paiements par période (mois/année)
  async findByPeriod(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.prisma.salary.findMany({
      where: {
        month: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });
  }

  // 7. Mettre à jour un paiement
  async update(id: string, data: any) {
    const salary = await this.prisma.salary.findUnique({
      where: { id }
    });

    if (!salary) {
      throw new NotFoundException(`Salaire avec ID ${id} non trouvé`);
    }

    // Recalculer le net si les montants changent
    const baseAmount = data.baseAmount ?? salary.baseAmount;
    const bonuses = data.bonuses ?? salary.bonuses;
    const deductions = data.deductions ?? salary.deductions;
    const netAmount = Number(baseAmount) + Number(bonuses) - Number(deductions);

    return this.prisma.salary.update({
      where: { id },
      data: {
        month: data.month ? new Date(data.month) : undefined,
        baseAmount: data.baseAmount,
        bonuses: data.bonuses,
        deductions: data.deductions,
        netAmount,
        isPaid: data.isPaid,
      },
      include: {
        teacher: true,
        staff: true
      }
    });
  }

  // 8. Marquer comme payé
  async markAsPaid(id: string) {
    const salary = await this.prisma.salary.findUnique({
      where: { id }
    });

    if (!salary) {
      throw new NotFoundException(`Salaire avec ID ${id} non trouvé`);
    }

    return this.prisma.salary.update({
      where: { id },
      data: {
        isPaid: true,
        paymentDate: new Date()
      },
      include: {
        teacher: true,
        staff: true
      }
    });
  }

  // 9. Supprimer un paiement
  async delete(id: string) {
    const salary = await this.prisma.salary.findUnique({
      where: { id }
    });

    if (!salary) {
      throw new NotFoundException(`Salaire avec ID ${id} non trouvé`);
    }

    return this.prisma.salary.delete({
      where: { id }
    });
  }

  // 10. Obtenir les statistiques
  async getStats() {
    const salaries = await this.prisma.salary.findMany({
      include: {
        teacher: true,
        staff: true
      }
    });

    const totalPaid = salaries
      .filter(s => s.isPaid)
      .reduce((acc, s) => acc + s.netAmount, 0);

    const totalPending = salaries
      .filter(s => !s.isPaid)
      .reduce((acc, s) => acc + s.netAmount, 0);

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const currentMonthSalaries = salaries.filter(s => {
      const salaryMonth = new Date(s.month);
      return salaryMonth >= currentMonth && salaryMonth < nextMonth;
    });

    const currentMonthPaid = currentMonthSalaries
      .filter(s => s.isPaid)
      .reduce((acc, s) => acc + s.netAmount, 0);

    const currentMonthPending = currentMonthSalaries
      .filter(s => !s.isPaid)
      .reduce((acc, s) => acc + s.netAmount, 0);

    // Par mois
    const byMonth = {};
    salaries.forEach(s => {
      const monthKey = s.month.toISOString().slice(0, 7);
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          total: 0,
          paid: 0,
          pending: 0,
          count: 0
        };
      }
      byMonth[monthKey].total += s.netAmount;
      byMonth[monthKey].count++;
      if (s.isPaid) {
        byMonth[monthKey].paid += s.netAmount;
      } else {
        byMonth[monthKey].pending += s.netAmount;
      }
    });

    // Par type de bénéficiaire
    const byType = {
      teachers: {
        total: salaries.filter(s => s.teacher).reduce((acc, s) => acc + s.netAmount, 0),
        count: salaries.filter(s => s.teacher).length
      },
      staff: {
        total: salaries.filter(s => s.staff).reduce((acc, s) => acc + s.netAmount, 0),
        count: salaries.filter(s => s.staff).length
      }
    };

    return {
      totalPaid,
      totalPending,
      currentMonth: {
        total: currentMonthSalaries.reduce((acc, s) => acc + s.netAmount, 0),
        paid: currentMonthPaid,
        pending: currentMonthPending,
        count: currentMonthSalaries.length
      },
      byMonth,
      byType
    };
  }

  // 11. Obtenir les paiements en attente
  async getPendingPayments() {
    return this.prisma.salary.findMany({
      where: { isPaid: false },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true
          }
        }
      },
      orderBy: {
        month: 'asc'
      }
    });
  }

  // 12. Obtenir le total des paiements par année
  async getYearlyStats(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const salaries = await this.prisma.salary.findMany({
      where: {
        month: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Définir le type directement dans la méthode sans l'exporter
    const monthlyStats: Array<{
      month: number;
      total: number;
      count: number;
      paid: number;
      pending: number;
    }> = [];
    
    for (let month = 0; month < 12; month++) {
      const monthSalaries = salaries.filter(s => s.month.getMonth() === month);
      monthlyStats.push({
        month: month + 1,
        total: monthSalaries.reduce((acc, s) => acc + s.netAmount, 0),
        count: monthSalaries.length,
        paid: monthSalaries.filter(s => s.isPaid).reduce((acc, s) => acc + s.netAmount, 0),
        pending: monthSalaries.filter(s => !s.isPaid).reduce((acc, s) => acc + s.netAmount, 0)
      });
    }

    return {
      year,
      total: salaries.reduce((acc, s) => acc + s.netAmount, 0),
      count: salaries.length,
      monthly: monthlyStats
    };
  }
// src/salaries/salaries.service.ts
async getPendingCount() {
  return this.prisma.salary.count({
    where: { isPaid: false }
  });
}
}