// src/dashboard/dashboard.service.ts (extrait avec les nouvelles méthodes)
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Activity } from './dashboard.interfaces';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [students, teachers, classes, staff, subjects, principals, pendingSalaries] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.teacher.count(),
      this.prisma.class.count(),
      this.prisma.staff.count(),
      this.prisma.subject.count(),
      this.prisma.teacher.count({
        where: {
          mainClassId: { not: null }
        }
      }),
      this.prisma.salary.count({
        where: { isPaid: false }
      })
    ]);

    // Compter les inscriptions du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const recentInscriptions = await this.prisma.student.count({
      where: {
        user: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }
    });

    return {
      students,
      teachers,
      classes,
      staff,
      subjects,
      principals,
      pendingSalaries,
      recentInscriptions,
      totalClasses: classes
    };
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    const activities: Activity[] = [];

    // 1. Récupérer les dernières inscriptions (élèves)
    const recentStudents = await this.prisma.student.findMany({
      take: limit,
      orderBy: {
        user: {
          createdAt: 'desc'
        }
      },
      include: {
        user: {
          select: {
            createdAt: true
          }
        },
        class: {
          select: {
            name: true
          }
        }
      }
    });

    recentStudents.forEach(s => {
      activities.push({
        id: `inscription-${s.id}`,
        date: s.user?.createdAt?.toISOString() || new Date().toISOString(),
        activity: `Nouvel élève inscrit: ${s.firstName} ${s.lastName} en ${s.class?.name || 'classe non assignée'}`,
        user: "Scolarité",
        type: 'inscription'
      });
    });

    // 2. Récupérer les dernières notes saisies
    const recentGrades = await this.prisma.grade.findMany({
      take: limit,
      orderBy: {
        id: 'desc'
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        subject: {
          select: {
            name: true
          }
        }
      }
    });

    recentGrades.forEach(g => {
      activities.push({
        id: `note-${g.id}`,
        date: new Date().toISOString(),
        activity: `Note saisie: ${g.student?.firstName || ''} ${g.student?.lastName || ''} - ${g.subject?.name || 'Matière'} (${g.value}/20)`,
        user: "Enseignant",
        type: 'note'
      });
    });

    // 3. Récupérer les derniers paiements de salaire
    const recentSalaries = await this.prisma.salary.findMany({
      take: limit,
      where: { isPaid: true },
      orderBy: {
        paymentDate: 'desc'
      },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    recentSalaries.forEach(s => {
      const beneficiary = s.teacher 
        ? `Prof. ${s.teacher.firstName} ${s.teacher.lastName}`
        : s.staff 
          ? `${s.staff.firstName} ${s.staff.lastName}`
          : 'Bénéficiaire inconnu';
      
      activities.push({
        id: `paiement-${s.id}`,
        date: s.paymentDate?.toISOString() || new Date().toISOString(),
        activity: `Paiement de salaire: ${beneficiary}`,
        user: "Comptabilité",
        type: 'paiement'
      });
    });

    // Trier par date (plus récent d'abord)
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async getRecentStudents(limit: number = 5) {
    const students = await this.prisma.student.findMany({
      take: limit,
      orderBy: {
        user: {
          createdAt: 'desc'
        }
      },
      include: {
        class: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            createdAt: true
          }
        }
      }
    });

    return students.map(s => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.class?.name || 'Non assigné',
      date: s.user?.createdAt?.toLocaleDateString('fr-FR') || new Date().toLocaleDateString('fr-FR')
    }));
  }

  // ================ NOUVEAUX ENDPOINTS ================

  async getEvolution() {
    const now = new Date();
    const evolution: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setMonth(nextDate.getMonth() + 1);

      const count = await this.prisma.student.count({
        where: {
          user: {
            createdAt: {
              lt: nextDate
            }
          }
        }
      });

      evolution.push(count);
    }

    return evolution;
  }

  async getDistribution() {
    const classes = await this.prisma.class.findMany({
      include: {
        _count: {
          select: { students: true }
        }
      },
      orderBy: {
        level: 'asc'
      }
    });

    return classes.map(c => ({
      level: c.name,
      count: c._count.students
    }));
  }

  async getSubjectsCount() {
    return this.prisma.subject.count();
  }

  async getPrincipalsCount() {
    return this.prisma.teacher.count({
      where: {
        mainClassId: { not: null }
      }
    });
  }

  async getPendingSalariesCount() {
    return this.prisma.salary.count({
      where: { isPaid: false }
    });
  }
}