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

  // ==================== PROFIL DE L'ÉLÈVE CONNECTÉ ====================
  async getProfile(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        class: { select: { id: true, name: true, level: true } },
        user: { select: { email: true, createdAt: true, isActive: true } },
      },
    });
    if (!student) {
      throw new NotFoundException('Profil élève introuvable pour cet utilisateur');
    }
    return student;
  }

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

  // src/students/students.service.ts (extrait modifié)

async getBulletin(studentId: string, trimester?: number) {
  const targetTrimester = trimester ?? 1;

  // 1. Élève + classe
  const student = await this.prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: { select: { id: true, name: true, level: true } },
      absences: true,
      punishments: true,
    },
  });
  if (!student) throw new NotFoundException(`Élève non trouvé`);

  // 2. Effectif de la classe (élèves non supprimés)
  const classTotal = await this.prisma.student.count({
    where: { classId: student.classId, isDeleted: false },
  });

  // 3. Récupérer tous les grades avec leurs sujets (incluant la catégorie)
  const allGrades = await this.prisma.grade.findMany({
    where: { studentId },
    include: { subject: true },
  });

  // 4. Récupérer tous les contrôles avec leurs sujets
  const allControls = await this.prisma.control.findMany({
    where: { studentId },
    include: { subject: true },
  });

  // 5. Construire une map par matière
  const subjectMap = new Map<
    string,
    {
      subject: any;
      coefficients: { [trimester: number]: number };
      devoirs: { [trimester: number]: number[] };
      compositions: { [trimester: number]: number[] };
      gradeValues: { [trimester: number]: number };
      categorie: string; // LITTERAIRE ou SCIENTIFIQUE
    }
  >();

  // Initialisation avec les grades
  for (const grade of allGrades) {
    const subjectId = grade.subjectId;
    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        subject: grade.subject,
        coefficients: {},
        devoirs: {},
        compositions: {},
        gradeValues: {},
        categorie: grade.subject.category || 'LITTERAIRE',
      });
    }
    const entry = subjectMap.get(subjectId)!;
    entry.coefficients[grade.trimester] = grade.coefficient || 1;
    entry.gradeValues[grade.trimester] = grade.value;
  }

  // Ajout des contrôles
  for (const control of allControls) {
    const subjectId = control.subjectId;
    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        subject: control.subject,
        coefficients: {},
        devoirs: {},
        compositions: {},
        gradeValues: {},
        categorie: control.subject.category || 'LITTERAIRE',
      });
    }
    const entry = subjectMap.get(subjectId)!;
    const trim = control.trimester;
    const type = control.type?.toUpperCase();
    if (type === 'DEVOIR') {
      if (!entry.devoirs[trim]) entry.devoirs[trim] = [];
      if (control.value != null) entry.devoirs[trim].push(control.value);
    } else if (type === 'INTERROGATION' || type === 'COMPOSITION') {
      if (!entry.compositions[trim]) entry.compositions[trim] = [];
      if (control.value != null) entry.compositions[trim].push(control.value);
    }
  }

  // 6. Calcul des moyennes par matière et par trimestre
  const matieresForTarget: any[] = [];
  const trimAverages: { [key: number]: number[] } = { 1: [], 2: [], 3: [] };
  const subjectAverages: { [key: number]: any[] } = { 1: [], 2: [], 3: [] };

  for (const [subjectId, entry] of subjectMap.entries()) {
    const subject = entry.subject;
    for (let t = 1; t <= 3; t++) {
      const devoirs = entry.devoirs[t] || [];
      const compositions = entry.compositions[t] || [];
      const gradeValue = entry.gradeValues[t];

      let moyenneMatiere: number | null = null;
      let devoirMoy: number | null = null;
      let compoMoy: number | null = null;

      if (devoirs.length > 0) {
        devoirMoy = Number((devoirs.reduce((a, b) => a + b, 0) / devoirs.length).toFixed(2));
      }
      if (compositions.length > 0) {
        compoMoy = Number((compositions.reduce((a, b) => a + b, 0) / compositions.length).toFixed(2));
      }

      if (devoirMoy !== null && compoMoy !== null) {
        moyenneMatiere = Number(((devoirMoy + 2 * compoMoy) / 3).toFixed(2));
      } else if (devoirMoy !== null) {
        moyenneMatiere = devoirMoy;
      } else if (compoMoy !== null) {
        moyenneMatiere = compoMoy;
      } else if (gradeValue !== undefined && gradeValue !== null) {
        moyenneMatiere = gradeValue;
      }

      if (moyenneMatiere !== null) {
        const coef = entry.coefficients[t] || 1;
        trimAverages[t].push(moyenneMatiere * coef);
        subjectAverages[t].push({
          subjectId,
          nom: subject.name,
          coefficient: coef,
          moyenne: moyenneMatiere,
          devoir: devoirMoy,
          composition: compoMoy,
          grade: gradeValue ?? null,
          categorie: entry.categorie,
        });
      }
    }

    // Pour le trimestre demandé
    if (targetTrimester) {
      const t = targetTrimester;
      const devoirs = entry.devoirs[t] || [];
      const compositions = entry.compositions[t] || [];
      const gradeValue = entry.gradeValues[t];
      let moyenneMatiere: number | null = null;
      let devoirMoy: number | null = null;
      let compoMoy: number | null = null;

      if (devoirs.length > 0) {
        devoirMoy = Number((devoirs.reduce((a, b) => a + b, 0) / devoirs.length).toFixed(2));
      }
      if (compositions.length > 0) {
        compoMoy = Number((compositions.reduce((a, b) => a + b, 0) / compositions.length).toFixed(2));
      }

      if (devoirMoy !== null && compoMoy !== null) {
        moyenneMatiere = Number(((devoirMoy + 2 * compoMoy) / 3).toFixed(2));
      } else if (devoirMoy !== null) {
        moyenneMatiere = devoirMoy;
      } else if (compoMoy !== null) {
        moyenneMatiere = compoMoy;
      } else if (gradeValue !== undefined && gradeValue !== null) {
        moyenneMatiere = gradeValue;
      }

      if (moyenneMatiere !== null) {
        const coef = entry.coefficients[t] || 1;
        matieresForTarget.push({
          id: subjectId,
          nom: subject.name,
          coefficient: coef,
          moyenne: moyenneMatiere,
          devoir: devoirMoy,
          composition: compoMoy,
          categorie: entry.categorie,
          appreciation: '',
        });
      }
    }
  }

  // 7. Calcul des moyennes trimestrielles générales
  const trimMoyennes: { [key: number]: number } = {};
  for (let t = 1; t <= 3; t++) {
    let sumWeighted = 0;
    let sumCoef = 0;
    for (const sub of subjectAverages[t] || []) {
      sumWeighted += sub.moyenne * sub.coefficient;
      sumCoef += sub.coefficient;
    }
    trimMoyennes[t] = sumCoef > 0 ? Number((sumWeighted / sumCoef).toFixed(2)) : 0;
  }

  // Moyenne annuelle
  const annuelle = (() => {
    const t1 = trimMoyennes[1] || 0;
    const t2 = trimMoyennes[2] || 0;
    const t3 = trimMoyennes[3] || 0;
    const count = [t1, t2, t3].filter(v => v > 0).length;
    if (count === 0) return 0;
    return Number(((t1 + t2 + t3) / count).toFixed(2));
  })();

  // 8. Absences et punitions pour le trimestre demandé
  const absencesCount = student.absences.filter((a) =>
    this.isAbsenceInTrimester(a, targetTrimester)
  ).length;

  const punishments = student.punishments.filter((p) => p.trimester === targetTrimester);

  // 9. Bulletin existant
  const bulletinRecord = await this.prisma.bulletin.findUnique({
    where: { studentId_trimester: { studentId, trimester: targetTrimester } },
  });

  // 10. Retour enrichi
  return {
    student: {
      firstName: student.firstName,
      lastName: student.lastName,
      registrationNo: student.registrationNo,
      class: student.class,
    },
    trimester: targetTrimester,
    period: `TRIMESTER_${targetTrimester}`,
    matieres: matieresForTarget,
    absences: absencesCount,
    punishments,
    conduite: {
      note: bulletinRecord?.conduiteNote ?? null,
      appreciation: bulletinRecord?.appreciation ?? '',
      totalHeuresColle: punishments.reduce((sum, p) => sum + p.hours, 0),
    },
    moyennes: {
      trimestre1: trimMoyennes[1] || 0,
      trimestre2: trimMoyennes[2] || 0,
      trimestre3: trimMoyennes[3] || 0,
      generale: trimMoyennes[targetTrimester] || 0,
    },
    trimestres: {
      trimestre1: trimMoyennes[1] || 0,
      trimestre2: trimMoyennes[2] || 0,
      trimestre3: trimMoyennes[3] || 0,
    },
    annuelle,
    appreciation: bulletinRecord?.appreciation || '',
    generatedAt: new Date().toISOString(),
    effectif: classTotal, // ← nouvel ajout
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