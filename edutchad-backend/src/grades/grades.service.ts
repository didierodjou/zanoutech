// src/grades/grades.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulletinStatus, Period } from '@prisma/client';

// ✅ Map trimester → Period (TRIMESTER_ pas TRIMESTRE_)
const PERIOD_MAP: Record<number, Period> = {
  1: Period.TRIMESTER_1,
  2: Period.TRIMESTER_2,
  3: Period.TRIMESTER_3,
};

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.grade.findMany({
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, registrationNo: true },
        },
        subject: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async findOne(id: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, registrationNo: true },
        },
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    if (!grade) throw new NotFoundException(`Note avec ID ${id} non trouvée`);
    return grade;
  }

  async update(id: string, data: any) {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) throw new NotFoundException(`Note avec ID ${id} non trouvée`);

    const updateData: any = {};
    if (data.value !== undefined) updateData.value = data.value;
    if (data.coefficient !== undefined) updateData.coefficient = data.coefficient;
    if (data.trimester !== undefined) {
      updateData.trimester = data.trimester;
      updateData.period = PERIOD_MAP[data.trimester]; // ✅
    }

    return this.prisma.grade.update({
      where: { id },
      data: updateData,
      include: { subject: true },
    });
  }

  async delete(id: string) {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) throw new NotFoundException(`Note avec ID ${id} non trouvée`);

    await this.prisma.grade.delete({ where: { id } });
    return { deleted: true, id };
  }

  async calculateAndSave(data: {
    studentId: string;
    subjectId: string;
    trimester: number;
    value: number;
    coefficient?: number;
  }) {
    const { studentId, subjectId, trimester, value, coefficient = 1 } = data;

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Élève non trouvé');

    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('Matière non trouvée');

    const period = PERIOD_MAP[trimester]; // ✅

    try {
      const grade = await this.prisma.grade.upsert({
        where: {
          studentId_subjectId_trimester: { studentId, subjectId, trimester },
        },
        update: { value, coefficient, period },
        create: { value, coefficient, period, trimester, studentId, subjectId },
        include: { subject: true },
      });

      await this.updateBulletin(studentId, trimester as 1 | 2 | 3);
      return grade;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note:', error);
      throw error;
    }
  }

  async updateBulletin(studentId: string, trimester: 1 | 2 | 3) {
    const period = PERIOD_MAP[trimester]; // ✅

    const grades = await this.prisma.grade.findMany({
      where: { studentId, trimester },
    });

    if (grades.length === 0) return;

    let totalPoints = 0;
    let totalCoefficients = 0;
    grades.forEach((g) => {
      totalPoints += g.value * g.coefficient;
      totalCoefficients += g.coefficient;
    });

    const generalAverage =
      totalCoefficients > 0 ? Number((totalPoints / totalCoefficients).toFixed(2)) : 0;

    const status: BulletinStatus =
      trimester === 3
        ? generalAverage > 0 ? BulletinStatus.CONFIRMED : BulletinStatus.PENDING
        : generalAverage > 0 ? BulletinStatus.VERIFIED : BulletinStatus.PENDING;

    let appreciation = 'Aucune note';
    if (generalAverage >= 16) appreciation = 'Excellent';
    else if (generalAverage >= 14) appreciation = 'Très bien';
    else if (generalAverage >= 12) appreciation = 'Bien';
    else if (generalAverage >= 10) appreciation = 'Passable';
    else if (generalAverage > 0) appreciation = 'Insuffisant';

    try {
      // ✅ La contrainte @@unique est sur [studentId, trimester] → studentId_trimester
      await this.prisma.bulletin.upsert({
        where: {
          studentId_trimester: { studentId, trimester }, // ✅
        },
        update: {
          generalAverage,
          status,
          appreciation,
          period,
          generatedAt: new Date(),
        },
        create: {
          period,
          trimester, // ✅ champ obligatoire
          generalAverage,
          status,
          appreciation,
          studentId,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du bulletin:', error);
    }
  }

  async getStudentGrades(studentId: string, trimester?: number) {
    const where: any = { studentId };
    if (trimester) where.trimester = trimester;

    return this.prisma.grade.findMany({
      where,
      include: { subject: true },
      orderBy: [{ trimester: 'asc' }, { subject: { name: 'asc' } }],
    });
  }

  async getGrades(classId: string, subjectId: string, trimester: number) {
    const students = await this.prisma.student.findMany({
      where: { classId },
      select: { id: true },
    });
    const studentIds = students.map((s) => s.id);

    const controls = await this.prisma.control.findMany({
      where: {
        studentId: { in: studentIds },
        subjectId,
        trimester,
        type: { in: ['DEVOIR', 'INTERROGATION'] },
      },
    });

    const grades = await this.prisma.grade.findMany({
      where: { studentId: { in: studentIds }, subjectId, trimester },
    });

    return studentIds
      .map((studentId) => {
        const devoirControl = controls.find(
          (c) => c.studentId === studentId && c.type === 'DEVOIR',
        );
        const interroControls = controls.filter(
          (c) => c.studentId === studentId && c.type === 'INTERROGATION',
        );
        const grade = grades.find((g) => g.studentId === studentId);

        return {
          studentId,
          subjectId,
          trimester,
          devoir: devoirControl?.value ?? null,
          interrogations: interroControls.map((c) => c.value),
          value: grade?.value ?? null,
          coefficient: grade?.coefficient ?? null,
        };
      })
      .filter((r) => r.devoir !== null || r.interrogations.length > 0 || r.value !== null);
  }

  async saveGrade(data: {
    studentId: string;
    subjectId: string;
    trimester: number;
    value: number;
    coefficient?: number;
    devoir?: number;
    interrogations?: number[];
  }) {
    const { studentId, subjectId, trimester, value, coefficient, devoir, interrogations } = data;

    const period = PERIOD_MAP[trimester]; // ✅

    const ops: Promise<any>[] = [];

    ops.push(
      this.prisma.grade.upsert({
        where: { studentId_subjectId_trimester: { studentId, subjectId, trimester } },
        update: { value, coefficient: coefficient ?? 1, period },
        create: { studentId, subjectId, trimester, value, coefficient: coefficient ?? 1, period },
      }),
    );

    ops.push(
      this.prisma.control.deleteMany({
        where: { studentId, subjectId, trimester, type: 'DEVOIR' },
      }),
    );

    ops.push(
      this.prisma.control.deleteMany({
        where: { studentId, subjectId, trimester, type: 'INTERROGATION' },
      }),
    );

    await Promise.all(ops);

    const creates: Promise<any>[] = [];

    // ✅ Control.title obligatoire — généré automatiquement
    if (devoir !== undefined && devoir > 0) {
      creates.push(
        this.prisma.control.create({
          data: {
            title: `Devoir T${trimester}`, // ✅
            studentId,
            subjectId,
            trimester,
            value: devoir,
            type: 'DEVOIR',
          },
        }),
      );
    }

    if (interrogations && interrogations.length > 0) {
      interrogations.forEach((interroValue, index) => {
        if (interroValue > 0) {
          creates.push(
            this.prisma.control.create({
              data: {
                title: `Interrogation ${index + 1} T${trimester}`, // ✅
                studentId,
                subjectId,
                trimester,
                value: interroValue,
                type: 'INTERROGATION',
              },
            }),
          );
        }
      });
    }

    if (creates.length > 0) await Promise.all(creates);

    return { success: true, studentId, subjectId, trimester, value };
  }
}