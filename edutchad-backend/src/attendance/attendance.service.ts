// src/attendance/attendance.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Récupérer les créneaux horaires d'un professeur pour une classe et une matière
  async getTeacherScheduleSlots(teacherId: string, classId: string, subjectId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) {
      throw new NotFoundException('Professeur non trouvé');
    }

    // Vérifier que le professeur enseigne bien cette matière dans cette classe
    const course = await this.prisma.course.findFirst({
      where: {
        teacherId,
        classId,
        subjectId
      },
      include: {
        scheduleSlots: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    if (!course) {
      throw new NotFoundException('Ce professeur n\'enseigne pas cette matière dans cette classe');
    }

    return {
      courseId: course.id,
      scheduleSlots: course.scheduleSlots
    };
  }

  // Récupérer les élèves d'une classe
  async getStudentsByClass(classId: string) {
    const students = await this.prisma.student.findMany({
      where: { classId },
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    return students;
  }

  // Récupérer les présences pour un cours spécifique à une date
  async getAttendanceByCourse(courseId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        courseId,
        date: {
          gte: targetDate,
          lt: nextDate
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
      }
    });

    return attendances;
  }

  // Enregistrer ou mettre à jour les présences
  async saveAttendance(data: {
    courseId: string;
    date: string;
    attendances: Array<{
      studentId: string;
      status: string;
    }>;
    scheduleSlotId?: string;
  }) {
    const targetDate = new Date(data.date);
    targetDate.setHours(0, 0, 0, 0);

    // Vérifier que le cours existe
    const course = await this.prisma.course.findUnique({
      where: { id: data.courseId }
    });

    if (!course) {
      throw new NotFoundException('Cours non trouvé');
    }

    // Utiliser une transaction pour toutes les opérations
    return this.prisma.$transaction(async (tx: any) => {
      const results: any[] = [];

      for (const att of data.attendances) {
        // Vérifier si une présence existe déjà
        const existing = await tx.attendance.findUnique({
          where: {
            studentId_courseId_date: {
              studentId: att.studentId,
              courseId: data.courseId,
              date: targetDate
            }
          }
        });

        if (existing) {
          // Mettre à jour
          const updated = await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status: att.status,
              scheduleSlotId: data.scheduleSlotId
            }
          });
          results.push(updated);
        } else {
          // Créer
          const created = await tx.attendance.create({
            data: {
              studentId: att.studentId,
              courseId: data.courseId,
              date: targetDate,
              status: att.status,
              scheduleSlotId: data.scheduleSlotId
            }
          });
          results.push(created);
        }
      }

      return {
        message: `Présences enregistrées pour ${results.length} élèves`,
        count: results.length
      };
    });
  }

  // Statistiques des présences pour une classe
  async getAttendanceStats(classId: string, startDate?: string, endDate?: string) {
    const filter: any = {
      course: {
        classId
      }
    };

    if (startDate) {
      filter.date = { ...filter.date, gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { ...filter.date, lte: end };
    }

    const attendances = await this.prisma.attendance.findMany({
      where: filter,
      include: {
        student: true,
        course: {
          include: {
            subject: true
          }
        }
      }
    });

    const total = attendances.length;
    const presents = attendances.filter(a => a.status === 'PRESENT').length;
    const absents = attendances.filter(a => a.status === 'ABSENT').length;
    const lates = attendances.filter(a => a.status === 'LATE').length;

    // Par matière
    const bySubject = attendances.reduce((acc, a) => {
      const subjectName = a.course.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = { total: 0, present: 0, absent: 0, late: 0 };
      }
      acc[subjectName].total++;
      if (a.status === 'PRESENT') acc[subjectName].present++;
      else if (a.status === 'ABSENT') acc[subjectName].absent++;
      else if (a.status === 'LATE') acc[subjectName].late++;
      return acc;
    }, {} as Record<string, any>);

    // Par élève
    const byStudent = attendances.reduce((acc, a) => {
      const studentName = `${a.student.firstName} ${a.student.lastName}`;
      if (!acc[studentName]) {
        acc[studentName] = { total: 0, present: 0, absent: 0, late: 0, studentId: a.student.id };
      }
      acc[studentName].total++;
      if (a.status === 'PRESENT') acc[studentName].present++;
      else if (a.status === 'ABSENT') acc[studentName].absent++;
      else if (a.status === 'LATE') acc[studentName].late++;
      return acc;
    }, {} as Record<string, any>);

    return {
      total,
      presents,
      absents,
      lates,
      attendanceRate: total > 0 ? ((presents + lates) / total * 100).toFixed(2) : 0,
      bySubject,
      byStudent: Object.values(byStudent)
    };
  }

  // Récupérer l'historique des présences d'un élève
  async getStudentAttendanceHistory(studentId: string, subjectId?: string) {
    const filter: any = { studentId };
    if (subjectId) {
      filter.course = { subjectId };
    }

    const attendances = await this.prisma.attendance.findMany({
      where: filter,
      include: {
        course: {
          include: {
            subject: true,
            class: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return attendances;
  }
}