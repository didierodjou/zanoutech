// src/students/students.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role, Period, PaymentStatus } from '@prisma/client';

const PERIOD_MAP: Record<number, Period> = {
  1: Period.TRIMESTER_1,
  2: Period.TRIMESTER_2,
  3: Period.TRIMESTER_3,
};

const PERIOD_TO_TRIMESTER: Record<string, number> = {
  TRIMESTER_1: 1,
  TRIMESTER_2: 2,
  TRIMESTER_3: 3,
};

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  // ==================== GÉNÉRATION MATRICULE ====================
  async generateRegistrationNo(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await this.prisma.student.count();
    const number = (count + 1).toString().padStart(4, '0');
    return `ETD-${year}-${number}`;
  }

  // ==================== CRUD DE BASE (avec soft delete) ====================

  async create(data: any) {
    const hashedPassword = await bcrypt.hash('student123', 10);

    let email = data.email;
    if (!email || email.trim() === '') {
      const registrationNo = data.registrationNo || (await this.generateRegistrationNo());
      email = `${registrationNo}@edutchad.local`;
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email, isDeleted: false },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    let registrationNo = data.registrationNo;
    if (!registrationNo) {
      registrationNo = await this.generateRegistrationNo();
    } else {
      const existingStudent = await this.prisma.student.findUnique({
        where: { registrationNo },
      });
      if (existingStudent) {
        registrationNo = await this.generateRegistrationNo();
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: Role.STUDENT,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          sex: data.sex || null,
          dateOfBirth: new Date(data.dateOfBirth),
          registrationNo,
          photo: data.photo || null,
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          parentEmail: data.parentEmail || null,
          classId: data.classId || null,
          tuitionFee: data.tuitionFee ?? null,
          tuitionPaid: 0,
          tuitionStatus: PaymentStatus.UNPAID,
        },
      });

      return student;
    });
  }

  async findAll(includeDeleted = false) {
    const where = includeDeleted ? {} : { isDeleted: false };
    const students = await this.prisma.student.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, level: true } },
        user: { select: { email: true, isActive: true, createdAt: true, isDeleted: true, deletedAt: true, deletedBy: true } },
        grades: {
          include: { subject: { select: { id: true, name: true, color: true } } },
        },
        _count: { select: { grades: true, absences: true, bulletins: true } },
      },
      orderBy: { lastName: 'asc' },
    });

    return students.map((student) => ({
      ...student,
      averages: this.calculateAllAverages(student.grades || []),
    }));
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, name: true, level: true } },
        user: { select: { email: true, isActive: true, createdAt: true, isDeleted: true, deletedAt: true, deletedBy: true } },
        grades: {
          include: { subject: { select: { id: true, name: true, color: true } } },
        },
        _count: { select: { grades: true, absences: true, bulletins: true } },
      },
    });

    if (!student) {
      throw new NotFoundException(`Élève avec ID ${id} non trouvé`);
    }

    return {
      ...student,
      averages: this.calculateAllAverages(student.grades || []),
    };
  }

  async getDetails(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, name: true, level: true } },
        user: { select: { email: true, createdAt: true, isActive: true, isDeleted: true, deletedAt: true, deletedBy: true } },
        grades: {
          include: {
            subject: { select: { id: true, name: true, color: true, category: true, coefficient: true } },
          },
          orderBy: { id: 'desc' },
        },
        absences: { orderBy: { date: 'desc' } },
        bulletins: { orderBy: { generatedAt: 'desc' } },
        punishments: { orderBy: { date: 'desc' } },
      },
    });

    if (!student) {
      throw new NotFoundException(`Élève avec ID ${id} non trouvé`);
    }

    return student;
  }

  async update(id: string, data: any) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException(`Élève avec ID ${id} non trouvé`);

    return this.prisma.student.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        sex: data.sex || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        photo: data.photo || null,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        classId: data.classId || null,
      },
      include: { class: true, user: { select: { email: true } } },
    });
  }

  // ==================== SOFT DELETE & RESTORE ====================

  async softDelete(id: string, deletedBy?: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException(`Élève ${id} non trouvé`);
    if (student.isDeleted) throw new ConflictException(`L'élève est déjà supprimé`);

    // Vérifier s'il a des données critiques (notes, absences, bulletins)
    const hasData = await this.prisma.student.findUnique({
      where: { id },
      include: { _count: { select: { grades: true, absences: true, bulletins: true } } },
    });
    if (hasData?._count.grades || hasData?._count.absences || hasData?._count.bulletins) {
      throw new ConflictException('Impossible de supprimer un élève ayant des notes, absences ou bulletins');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: student.userId },
        data: { isDeleted: true, deletedAt: new Date(), deletedBy: deletedBy || 'system' },
      });
      return tx.student.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date(), deletedBy: deletedBy || 'system' },
      });
    });
  }

  async restore(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException(`Élève ${id} non trouvé`);
    if (!student.isDeleted) throw new ConflictException(`L'élève n'est pas supprimé`);

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: student.userId },
        data: { isDeleted: false, deletedAt: null, deletedBy: null },
      });
      return tx.student.update({
        where: { id },
        data: { isDeleted: false, deletedAt: null, deletedBy: null },
      });
    });
  }

  async getDeleted() {
    return this.prisma.student.findMany({
      where: { isDeleted: true },
      include: {
        class: { select: { name: true, level: true } },
        user: { select: { email: true, isActive: true, deletedAt: true, deletedBy: true } },
      },
    });
  }

  // ==================== PAIEMENTS SCOLARITÉ ====================

  async getPaymentStatus(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        tuitionFee: true,
        tuitionPaid: true,
        tuitionStatus: true,
        paymentDate: true,
        paymentMethod: true,
        paymentReference: true,
      },
    });
    if (!student) throw new NotFoundException('Élève non trouvé');
    return student;
  }

  async recordPayment(studentId: string, amount: number, method: string, reference?: string) {
    if (amount <= 0) throw new BadRequestException('Le montant doit être supérieur à 0');

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Élève non trouvé');
    if (student.isDeleted) throw new ConflictException('Impossible : élève supprimé');

    const newPaid = (student.tuitionPaid || 0) + amount;
    const fee = student.tuitionFee;
    let status: PaymentStatus = PaymentStatus.UNPAID;
    if (fee && newPaid >= fee) status = PaymentStatus.PAID;
    else if (newPaid > 0) status = PaymentStatus.PARTIAL;

    return this.prisma.student.update({
      where: { id: studentId },
      data: {
        tuitionPaid: newPaid,
        tuitionStatus: status,
        paymentDate: new Date(),
        paymentMethod: method,
        paymentReference: reference || null,
      },
    });
  }

  async setTuitionFee(studentId: string, fee: number) {
    if (fee < 0) throw new BadRequestException('Le montant doit être >= 0');
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Élève non trouvé');

    let status: PaymentStatus = PaymentStatus.UNPAID;
    if (fee === 0) status = PaymentStatus.PAID;
    else if (student.tuitionPaid >= fee) status = PaymentStatus.PAID;
    else if (student.tuitionPaid > 0) status = PaymentStatus.PARTIAL;

    return this.prisma.student.update({
      where: { id: studentId },
      data: { tuitionFee: fee, tuitionStatus: status },
    });
  }

  // ==================== PUNITIONS ====================

  async addPunishment(studentId: string, data: { hours: number; reason?: string; trimester: number; givenBy?: string }) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException(`Élève non trouvé`);
    return this.prisma.punishment.create({
      data: {
        studentId,
        hours: data.hours,
        reason: data.reason || null,
        trimester: data.trimester,
        givenBy: data.givenBy || 'Système',
        date: new Date(),
      },
    });
  }

  async getPunishments(studentId: string, trimester?: number) {
    return this.prisma.punishment.findMany({
      where: { studentId, ...(trimester ? { trimester } : {}) },
      orderBy: { date: 'desc' },
    });
  }

  async deletePunishment(punishmentId: string) {
    const punishment = await this.prisma.punishment.findUnique({ where: { id: punishmentId } });
    if (!punishment) throw new NotFoundException(`Punition non trouvée`);
    await this.prisma.punishment.delete({ where: { id: punishmentId } });
    return { message: 'Punition supprimée' };
  }

  // ==================== CONDUITE ====================

  async getConduiteNote(studentId: string, trimester: number): Promise<{ note: number | null; punishmentsHours: number }> {
    const punishments = await this.prisma.punishment.findMany({ where: { studentId, trimester } });
    const totalHeures = punishments.reduce((acc, p) => acc + p.hours, 0);
    const bulletin = await this.prisma.bulletin.findUnique({
      where: { studentId_trimester: { studentId, trimester } },
    });
    return { note: bulletin?.conduiteNote ?? null, punishmentsHours: totalHeures };
  }

  async setConduiteNote(studentId: string, trimester: number, conduiteNote: number) {
    if (conduiteNote < 0 || conduiteNote > 20) {
      throw new ConflictException('La note de conduite doit être entre 0 et 20');
    }
    const period = PERIOD_MAP[trimester];
    const existing = await this.prisma.bulletin.findUnique({
      where: { studentId_trimester: { studentId, trimester } },
    });
    if (existing) {
      return this.prisma.bulletin.update({ where: { id: existing.id }, data: { conduiteNote } });
    } else {
      return this.prisma.bulletin.create({
        data: { studentId, period, trimester, conduiteNote, status: 'PENDING' },
      });
    }
  }

  async resetConduiteNote(studentId: string, trimester: number) {
    const existing = await this.prisma.bulletin.findUnique({
      where: { studentId_trimester: { studentId, trimester } },
    });
    if (existing) {
      await this.prisma.bulletin.update({ where: { id: existing.id }, data: { conduiteNote: null } });
    }
    return { message: 'Note de conduite réinitialisée' };
  }

  async setConduiteForAll(trimester: number, conduiteNote: number, classId?: string) {
    if (conduiteNote < 0 || conduiteNote > 20) {
      throw new ConflictException('La note de conduite doit être entre 0 et 20');
    }
    const period = PERIOD_MAP[trimester];
    const students = await this.prisma.student.findMany({
      where: classId ? { classId, isDeleted: false } : { isDeleted: false },
      select: { id: true },
    });
    for (const student of students) {
      const existing = await this.prisma.bulletin.findUnique({
        where: { studentId_trimester: { studentId: student.id, trimester } },
      });
      if (existing) {
        await this.prisma.bulletin.update({ where: { id: existing.id }, data: { conduiteNote } });
      } else {
        await this.prisma.bulletin.create({
          data: { studentId: student.id, period, trimester, conduiteNote, status: 'PENDING' },
        });
      }
    }
    return { message: `Note appliquée à ${students.length} élèves`, count: students.length };
  }

  // ==================== BULLETIN & RAPPORT (CORRIGÉ) ====================

  async getBulletin(studentId: string, trimester?: number) {
  const student = await this.prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: { select: { id: true, name: true, level: true } },
      grades: {
        include: {
          subject: true,
          control: true,
        },
        where: { trimester: trimester ?? 1 },
      },
      absences: true,
      punishments: true,
    },
  });

  if (!student) throw new NotFoundException(`Élève non trouvé`);

  const currentTrimester = trimester ?? 1;

  const matieresMap = new Map();

  for (const grade of student.grades) {
    const subjectId = grade.subject.id;
    if (!matieresMap.has(subjectId)) {
      matieresMap.set(subjectId, {
        id: subjectId,
        nom: grade.subject.name,
        coefficient: grade.subject.coefficient,
        devoirNote: null,
        compositionNotes: [],
      });
    }

    const entry = matieresMap.get(subjectId);
    const controlType = grade.control?.type?.toUpperCase();

    if (controlType === 'DEVOIR') {
      if (entry.devoirNote === null) {
        entry.devoirNote = grade.value;
      }
    } else if (controlType === 'COMPOSITION' || controlType === 'INTERROGATION') {
      entry.compositionNotes.push(grade.value);
    }
  }

  const matieres = Array.from(matieresMap.values()).map((entry) => {
    const moyenneComposition =
      entry.compositionNotes.length > 0
        ? Number((entry.compositionNotes.reduce((a, b) => a + b, 0) / entry.compositionNotes.length).toFixed(2))
        : null;

    return {
      id: entry.id,
      nom: entry.nom,
      coefficient: entry.coefficient,
      moyenne: moyenneComposition,
      devoir: entry.devoirNote,
      composition: moyenneComposition,
      appreciation: '', // sera rempli plus tard
    };
  });

  const absencesCount = student.absences.filter((a) =>
    this.isAbsenceInTrimester(a, currentTrimester)
  ).length;

  const punishments = student.punishments.filter((p) => p.trimester === currentTrimester);
  const bulletinRecord = await this.prisma.bulletin.findUnique({
    where: { studentId_trimester: { studentId, trimester: currentTrimester } },
  });
  const trimAverages = this.calculateAllAverages(student.grades);

  return {
    student: {
      firstName: student.firstName,
      lastName: student.lastName,
      registrationNo: student.registrationNo,
      class: student.class,
    },
    trimester: currentTrimester,
    period: `TRIMESTER_${currentTrimester}`,
    matieres,
    absences: absencesCount,
    punishments,
    conduite: {
      note: bulletinRecord?.conduiteNote ?? null,
      appreciation: bulletinRecord?.appreciation ?? '',
      totalHeuresColle: punishments.reduce((sum, p) => sum + p.hours, 0),
    },
    moyennes: {
      trimestre1: trimAverages.trimestre1,
      trimestre2: trimAverages.trimestre2,
      trimestre3: trimAverages.trimestre3,
      generale: trimAverages.annuelle,
    },
    trimestres: {
      trimestre1: trimAverages.trimestre1,
      trimestre2: trimAverages.trimestre2,
      trimestre3: trimAverages.trimestre3,
    },
    annuelle: trimAverages.annuelle,
    appreciation: bulletinRecord?.appreciation ?? '',
    generatedAt: new Date().toISOString(),
  };
}

  async getStudentReport(studentId: string, period: Period) {
    const trimester = PERIOD_TO_TRIMESTER[period] ?? 3;
    return this.getBulletin(studentId, trimester);
  }

  // ==================== HELPERS ====================

  private isAbsenceInTrimester(absence: any, trimester: number): boolean {
    const date = new Date(absence.date);
    const month = date.getMonth() + 1;
    switch (trimester) {
      case 1: return month >= 9 && month <= 11;
      case 2: return month === 12 || month === 1 || month === 2;
      case 3: return month >= 3 && month <= 6;
      default: return true;
    }
  }

  private async calculerRang(studentId: string, classId: string | null, trimester?: number) {
    if (!classId) return { position: 0, total: 0 };
    const students = await this.prisma.student.findMany({
      where: { classId },
      include: { grades: trimester ? { where: { trimester } } : true },
    });
    const averages = students.map((s) => {
      const grades = s.grades || [];
      if (grades.length === 0) return { studentId: s.id, average: 0 };
      const totalPoints = grades.reduce((acc, g) => acc + g.value * (g.coefficient || 1), 0);
      const totalCoef = grades.reduce((acc, g) => acc + (g.coefficient || 1), 0);
      return { studentId: s.id, average: totalCoef > 0 ? totalPoints / totalCoef : 0 };
    }).sort((a, b) => b.average - a.average);
    const position = averages.findIndex((s) => s.studentId === studentId) + 1;
    return { position, total: students.length };
  }

  calculatePeriodAverage(grades: any[], period: Period): number {
    const periodGrades = grades.filter((g) => g.period === period);
    if (periodGrades.length === 0) return 0;
    const totalPoints = periodGrades.reduce((acc, g) => acc + g.value * (g.coefficient || 1), 0);
    const totalCoef = periodGrades.reduce((acc, g) => acc + (g.coefficient || 1), 0);
    return totalCoef > 0 ? Number((totalPoints / totalCoef).toFixed(2)) : 0;
  }

  calculateTrimesterAverage(grades: any[], trimester: number): number {
    const trimGrades = grades.filter((g) => g.trimester === trimester);
    if (trimGrades.length === 0) return 0;
    const totalPoints = trimGrades.reduce((acc, g) => acc + g.value * (g.coefficient || 1), 0);
    const totalCoef = trimGrades.reduce((acc, g) => acc + (g.coefficient || 1), 0);
    return totalCoef > 0 ? Number((totalPoints / totalCoef).toFixed(2)) : 0;
  }

  calculateAllAverages(grades: any[]) {
    return {
      trimestre1: this.calculateTrimesterAverage(grades, 1),
      trimestre2: this.calculateTrimesterAverage(grades, 2),
      trimestre3: this.calculateTrimesterAverage(grades, 3),
      annuelle:
        (this.calculateTrimesterAverage(grades, 1) +
          this.calculateTrimesterAverage(grades, 2) +
          this.calculateTrimesterAverage(grades, 3)) /
        3,
    };
  }

  calculateSubjectAverages(grades: any[], period: Period) {
    const periodGrades = grades.filter((g) => g.period === period);
    const subjectsMap = new Map();
    periodGrades.forEach((grade) => {
      if (grade.subject) {
        const subjectId = grade.subject.id;
        if (!subjectsMap.has(subjectId)) {
          subjectsMap.set(subjectId, {
            subjectId,
            subject: grade.subject.name,
            color: grade.subject.color || '#3498db',
            grades: [],
            totalPoints: 0,
            totalCoefficients: 0,
          });
        }
        const sd = subjectsMap.get(subjectId);
        sd.grades.push(grade.value);
        sd.totalPoints += grade.value * (grade.coefficient || 1);
        sd.totalCoefficients += grade.coefficient || 1;
      }
    });
    const result: any[] = [];
    subjectsMap.forEach((data) => {
      result.push({
        subjectId: data.subjectId,
        subject: data.subject,
        color: data.color,
        average: data.totalCoefficients > 0 ? Number((data.totalPoints / data.totalCoefficients).toFixed(2)) : 0,
        grades: data.grades,
        coefficient: data.totalCoefficients / data.grades.length,
      });
    });
    return result;
  }
}