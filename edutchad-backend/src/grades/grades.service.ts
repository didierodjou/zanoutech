// src/grades/grades.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulletinStatus, Period } from '@prisma/client';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.grade.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNo: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });
  }

  async findOne(id: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNo: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    if (!grade) {
      throw new NotFoundException(`Note avec ID ${id} non trouvée`);
    }

    return grade;
  }

  async update(id: string, data: any) {
    const grade = await this.prisma.grade.findUnique({
      where: { id }
    });

    if (!grade) {
      throw new NotFoundException(`Note avec ID ${id} non trouvée`);
    }

    // Déterminer la période en fonction du trimestre si fourni
    let period: Period | undefined;
    if (data.trimester) {
      if (data.trimester === 1) period = Period.TRIMESTRE_1;
      else if (data.trimester === 2) period = Period.TRIMESTRE_2;
      else if (data.trimester === 3) period = Period.TRIMESTRE_3;
    }

    const updateData: any = {};
    
    if (data.value !== undefined) updateData.value = data.value;
    if (data.coefficient !== undefined) updateData.coefficient = data.coefficient;
    if (period !== undefined) updateData.period = period;
    if (data.trimester !== undefined) updateData.trimester = data.trimester;

    return this.prisma.grade.update({
      where: { id },
      data: updateData,
      include: {
        subject: true
      }
    });
  }

  async delete(id: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id }
    });

    if (!grade) {
      throw new NotFoundException(`Note avec ID ${id} non trouvée`);
    }

    await this.prisma.grade.delete({
      where: { id }
    });

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

    // Vérifier si l'élève existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      throw new NotFoundException('Élève non trouvé');
    }

    // Vérifier si la matière existe
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      throw new NotFoundException('Matière non trouvée');
    }

    // Déterminer la période en fonction du trimestre
    let period: Period = Period.TRIMESTRE_1;
    if (trimester === 2) period = Period.TRIMESTRE_2;
    else if (trimester === 3) period = Period.TRIMESTRE_3;

    // Chercher si une note existe déjà (contrainte unique sur studentId, subjectId, trimester)
    try {
      const grade = await this.prisma.grade.upsert({
        where: {
          studentId_subjectId_trimester: {
            studentId,
            subjectId,
            trimester
          }
        },
        update: {
          value,
          coefficient,
          period
        },
        create: {
          value,
          coefficient,
          period,
          trimester,
          studentId,
          subjectId
        },
        include: {
          subject: true
        }
      });

      // Mettre à jour ou créer le bulletin
      await this.updateBulletin(studentId, trimester as 1 | 2 | 3);

      return grade;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note:', error);
      throw error;
    }
  }

  async updateBulletin(studentId: string, trimester: 1 | 2 | 3) {
    // Déterminer la période
    let period: Period = Period.TRIMESTRE_1;
    if (trimester === 2) period = Period.TRIMESTRE_2;
    else if (trimester === 3) period = Period.TRIMESTRE_3;

    // Récupérer toutes les notes de l'élève pour ce trimestre
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        trimester
      }
    });

    if (grades.length === 0) return;

    // Calculer la moyenne générale pondérée
    let totalPoints = 0;
    let totalCoefficients = 0;

    grades.forEach(g => {
      totalPoints += g.value * g.coefficient;
      totalCoefficients += g.coefficient;
    });

    const generalAverage = totalCoefficients > 0 
      ? Number((totalPoints / totalCoefficients).toFixed(2))
      : 0;

    // Déterminer le statut
    let status: BulletinStatus = BulletinStatus.PENDING;
    if (trimester === 3) {
      // Pour le 3ème trimestre, on peut considérer comme confirmé si moyenne > 0
      status = generalAverage > 0 ? BulletinStatus.CONFIRMED : BulletinStatus.PENDING;
    } else {
      status = generalAverage > 0 ? BulletinStatus.VERIFIED : BulletinStatus.PENDING;
    }

    // Déterminer l'appréciation
    let appreciation = '';
    if (generalAverage >= 16) appreciation = 'Excellent';
    else if (generalAverage >= 14) appreciation = 'Très bien';
    else if (generalAverage >= 12) appreciation = 'Bien';
    else if (generalAverage >= 10) appreciation = 'Passable';
    else if (generalAverage > 0) appreciation = 'Insuffisant';
    else appreciation = 'Aucune note';

    // Utiliser upsert pour créer ou mettre à jour le bulletin
    try {
      await this.prisma.bulletin.upsert({
        where: {
          studentId_period: {
            studentId,
            period
          }
        },
        update: {
          generalAverage,
          status,
          appreciation,
          generatedAt: new Date()
        },
        create: {
          period,
          generalAverage,
          status,
          appreciation,
          studentId
        }
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
      include: {
        subject: true
      },
      orderBy: [
        { trimester: 'asc' },
        { subject: { name: 'asc' } }
      ]
    });
  }

  async getGrades(classId: string, subjectId: string, trimester: number) {
    // Récupérer les élèves de la classe
    const students = await this.prisma.student.findMany({
      where: { classId },
      select: { id: true },
    });
    const studentIds = students.map(s => s.id);

    // Récupérer les contrôles existants (type DEVOIR ou INTERROGATION)
    const controls = await this.prisma.control.findMany({
      where: {
        studentId: { in: studentIds },
        subjectId,
        trimester,
        type: { in: ['DEVOIR', 'INTERROGATION'] },
      },
    });

    // Récupérer les grades (moyennes)
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId: { in: studentIds },
        subjectId,
        trimester,
      },
    });

    // Regrouper par étudiant
    return studentIds.map(studentId => {
      const devoirControl = controls.find(c => c.studentId === studentId && c.type === 'DEVOIR');
      const interroControls = controls.filter(c => c.studentId === studentId && c.type === 'INTERROGATION');
      const grade = grades.find(g => g.studentId === studentId);

      return {
        studentId,
        subjectId,
        trimester,
        devoir: devoirControl?.value ?? null,
        interrogations: interroControls.map(c => c.value),
        value: grade?.value ?? null,
        coefficient: grade?.coefficient ?? null,
      };
    }).filter(r => r.devoir !== null || r.interrogations.length > 0 || r.value !== null);
  }

  // ── Sauvegarder les notes d'un élève ─────────────────────────────────────
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

    // Déterminer la période en fonction du trimestre
    let period: Period = Period.TRIMESTRE_1;
    if (trimester === 2) period = Period.TRIMESTRE_2;
    else if (trimester === 3) period = Period.TRIMESTRE_3;

    const ops: Promise<any>[] = [];

    // 1. Upsert la moyenne finale dans Grade (avec le champ period obligatoire)
    ops.push(
      this.prisma.grade.upsert({
        where: {
          studentId_subjectId_trimester: { studentId, subjectId, trimester },
        },
        update: { 
          value, 
          coefficient: coefficient ?? 1,
          period // Ajout du period dans update
        },
        create: { 
          studentId, 
          subjectId, 
          trimester, 
          value, 
          coefficient: coefficient ?? 1,
          period // Ajout du period dans create
        },
      })
    );

    // 2. Supprimer les anciens contrôles DEVOIR pour cet élève/matière/trimestre
    ops.push(
      this.prisma.control.deleteMany({
        where: { studentId, subjectId, trimester, type: 'DEVOIR' },
      })
    );

    // 3. Supprimer les anciens contrôles INTERROGATION
    ops.push(
      this.prisma.control.deleteMany({
        where: { studentId, subjectId, trimester, type: 'INTERROGATION' },
      })
    );

    await Promise.all(ops);

    const creates: Promise<any>[] = [];

    // 4. Créer le nouveau contrôle DEVOIR si fourni
    if (devoir !== undefined && devoir > 0) {
      creates.push(
        this.prisma.control.create({
          data: { studentId, subjectId, trimester, value: devoir, type: 'DEVOIR' },
        })
      );
    }

    // 5. Créer les contrôles INTERROGATION
    if (interrogations && interrogations.length > 0) {
      for (const interroValue of interrogations) {
        if (interroValue > 0) {
          creates.push(
            this.prisma.control.create({
              data: { studentId, subjectId, trimester, value: interroValue, type: 'INTERROGATION' },
            })
          );
        }
      }
    }

    if (creates.length > 0) await Promise.all(creates);

    return { success: true, studentId, subjectId, trimester, value };
  }
}