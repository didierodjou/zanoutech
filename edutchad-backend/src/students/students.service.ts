// src/students/students.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role, Period } from '@prisma/client';

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

  // ==================== CRUD DE BASE ====================

  async create(data: any) {
    const hashedPassword = await bcrypt.hash('student123', 10);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const registrationNo = data.registrationNo || await this.generateRegistrationNo();

    const existingStudent = await this.prisma.student.findUnique({
      where: { registrationNo }
    });

    if (existingStudent) {
      return this.create({ ...data, registrationNo: undefined });
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
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
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          parentEmail: data.parentEmail || null,
          classId: data.classId || null,
        },
      });

      return student;
    });
  }

  async findAll() {
    const students = await this.prisma.student.findMany({
      include: {
        class: {
          select: { id: true, name: true, level: true }
        },
        user: {
          select: { email: true, isActive: true, createdAt: true }
        },
        grades: {
          include: {
            subject: { select: { id: true, name: true, color: true } }
          }
        },
        _count: {
          select: { grades: true, absences: true, bulletins: true }
        }
      },
      orderBy: { lastName: 'asc' }
    });

    return students.map(student => ({
      ...student,
      averages: this.calculateAllAverages(student.grades || [])
    }));
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, name: true, level: true } },
        user: { select: { email: true, isActive: true, createdAt: true } },
        grades: {
          include: {
            subject: { select: { id: true, name: true, color: true } }
          }
        },
        _count: { select: { grades: true, absences: true, bulletins: true } }
      }
    });

    if (!student) {
      throw new NotFoundException(`Élève avec ID ${id} non trouvé`);
    }

    return {
      ...student,
      averages: this.calculateAllAverages(student.grades || [])
    };
  }

  async getDetails(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, name: true, level: true } },
        user: { select: { email: true, createdAt: true, isActive: true } },
        grades: {
          include: {
            subject: {
              select: { id: true, name: true, color: true, category: true, coefficient: true }
            },
          },
          orderBy: { id: 'desc' }
        },
        absences: { orderBy: { date: 'desc' } },
        bulletins: { orderBy: { generatedAt: 'desc' } },
        punishments: { orderBy: { date: 'desc' } }
      }
    });

    if (!student) {
      throw new NotFoundException(`Élève avec ID ${id} non trouvé`);
    }

    return student;
  }

  async update(id: string, data: any) {
    const student = await this.prisma.student.findUnique({ where: { id } });

    if (!student) {
      throw new NotFoundException(`Élève avec ID ${id} non trouvé`);
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        sex: data.sex || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        classId: data.classId || null,
      },
      include: {
        class: true,
        user: { select: { email: true } }
      }
    });
  }

  async delete(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        _count: { select: { grades: true, absences: true, bulletins: true } }
      }
    });

    if (!student) {
      throw new NotFoundException(`Élève avec ID ${id} non trouvé`);
    }

    if (student._count.grades > 0 || student._count.absences > 0 || student._count.bulletins > 0) {
      throw new ConflictException('Impossible de supprimer un élève qui a des notes, absences ou bulletins');
    }

    return this.prisma.$transaction([
      this.prisma.user.delete({ where: { id: student.userId } }),
      this.prisma.student.delete({ where: { id } })
    ]);
  }

  // ==================== PUNITIONS (HEURES DE COLLE) ====================

  async addPunishment(studentId: string, data: { hours: number; reason?: string; trimester: number; givenBy?: string }) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException(`Élève avec ID ${studentId} non trouvé`);

    const punishment = await this.prisma.punishment.create({
      data: {
        studentId,
        hours: data.hours,
        reason: data.reason || null,
        trimester: data.trimester,
        givenBy: data.givenBy || 'Système',
        date: new Date()
      }
    });

    return punishment;
  }

  async getPunishments(studentId: string, trimester?: number) {
    return this.prisma.punishment.findMany({
      where: {
        studentId,
        ...(trimester ? { trimester } : {})
      },
      orderBy: { date: 'desc' }
    });
  }

  async deletePunishment(punishmentId: string) {
    const punishment = await this.prisma.punishment.findUnique({ 
      where: { id: punishmentId }
    });
    
    if (!punishment) throw new NotFoundException(`Punition avec ID ${punishmentId} non trouvée`);
    
    await this.prisma.punishment.delete({ where: { id: punishmentId } });
    return { message: 'Punition supprimée' };
  }

  // ==================== GESTION CONDUITE (MANUELLE) ====================

  /**
   * Récupère la note de conduite actuelle d'un élève pour un trimestre
   * (uniquement la valeur manuelle stockée dans Bulletin)
   */
  async getConduiteNote(studentId: string, trimester: number): Promise<{ 
    note: number | null; 
    punishmentsHours: number;
  }> {
    const periodMap: Record<number, Period> = {
      1: Period.TRIMESTRE_1,
      2: Period.TRIMESTRE_2,
      3: Period.TRIMESTRE_3
    };
    const period = periodMap[trimester];

    const punishments = await this.prisma.punishment.findMany({
      where: { studentId, trimester }
    });
    const totalHeures = punishments.reduce((acc, p) => acc + p.hours, 0);

    const bulletin = await this.prisma.bulletin.findUnique({
      where: { studentId_period: { studentId, period } }
    });

    return {
      note: bulletin?.conduiteNote ?? null,
      punishmentsHours: totalHeures
    };
  }

  /**
   * Définit manuellement la note de conduite pour un élève spécifique
   */
  async setConduiteNote(studentId: string, trimester: number, conduiteNote: number) {
    if (conduiteNote < 0 || conduiteNote > 20) {
      throw new ConflictException('La note de conduite doit être entre 0 et 20');
    }

    const periodMap: Record<number, Period> = {
      1: Period.TRIMESTRE_1,
      2: Period.TRIMESTRE_2,
      3: Period.TRIMESTRE_3
    };
    const period = periodMap[trimester];

    const existing = await this.prisma.bulletin.findUnique({
      where: { studentId_period: { studentId, period } }
    });

    if (existing) {
      return this.prisma.bulletin.update({
        where: { id: existing.id },
        data: { conduiteNote }
      });
    } else {
      return this.prisma.bulletin.create({
        data: {
          studentId,
          period,
          conduiteNote,
          status: 'PENDING'
        }
      });
    }
  }

  /**
   * Supprime la note de conduite manuelle (revient à non défini)
   */
  async resetConduiteNote(studentId: string, trimester: number) {
    const periodMap: Record<number, Period> = {
      1: Period.TRIMESTRE_1,
      2: Period.TRIMESTRE_2,
      3: Period.TRIMESTRE_3
    };
    const period = periodMap[trimester];

    const existing = await this.prisma.bulletin.findUnique({
      where: { studentId_period: { studentId, period } }
    });

    if (existing) {
      await this.prisma.bulletin.update({
        where: { id: existing.id },
        data: { conduiteNote: null }
      });
    }

    return { message: 'Note de conduite réinitialisée' };
  }

  /**
   * Définit la même note de conduite pour tous les élèves d'une classe ou de tout l'établissement
   */
  async setConduiteForAll(trimester: number, conduiteNote: number, classId?: string) {
    if (conduiteNote < 0 || conduiteNote > 20) {
      throw new ConflictException('La note de conduite doit être entre 0 et 20');
    }

    const periodMap: Record<number, Period> = {
      1: Period.TRIMESTRE_1,
      2: Period.TRIMESTRE_2,
      3: Period.TRIMESTRE_3
    };
    const period = periodMap[trimester];

    const whereClause: any = {};
    if (classId) {
      whereClause.classId = classId;
    }

    const students = await this.prisma.student.findMany({
      where: whereClause,
      select: { id: true }
    });

    const results: string[] = [];
    for (const student of students) {
      const existing = await this.prisma.bulletin.findUnique({
        where: { studentId_period: { studentId: student.id, period } }
      });
      if (existing) {
        await this.prisma.bulletin.update({
          where: { id: existing.id },
          data: { conduiteNote }
        });
      } else {
        await this.prisma.bulletin.create({
          data: {
            studentId: student.id,
            period,
            conduiteNote,
            status: 'PENDING'
          }
        });
      }
      results.push(student.id);
    }

    return { message: `Note de conduite ${conduiteNote}/20 appliquée à ${results.length} élèves`, count: results.length };
  }

  // ==================== FONCTIONS DE CALCUL ====================

  calculatePeriodAverage(grades: any[], period: Period): number {
    const periodGrades = grades.filter(g => g.period === period);
    if (periodGrades.length === 0) return 0;

    let totalPoints = 0;
    let totalCoefficients = 0;
    periodGrades.forEach(grade => {
      totalPoints += grade.value * (grade.coefficient || 1);
      totalCoefficients += (grade.coefficient || 1);
    });
    return totalCoefficients > 0 ? Number((totalPoints / totalCoefficients).toFixed(2)) : 0;
  }

  calculateAllAverages(grades: any[]) {
    const trimestre1 = this.calculateTrimesterAverage(grades, 1);
    const trimestre2 = this.calculateTrimesterAverage(grades, 2);
    const trimestre3 = this.calculateTrimesterAverage(grades, 3);

    const trimestresValides = [trimestre1, trimestre2, trimestre3].filter(m => m > 0);
    const annuelle = trimestresValides.length > 0
      ? Number((trimestresValides.reduce((a, b) => a + b, 0) / trimestresValides.length).toFixed(2))
      : 0;

    return { trimestre1, trimestre2, trimestre3, annuelle };
  }

  calculateTrimesterAverage(grades: any[], trimester: number): number {
    const trimesterGrades = grades.filter(g => g.trimester === trimester);
    if (trimesterGrades.length === 0) return 0;

    let totalPoints = 0;
    let totalCoefficients = 0;
    trimesterGrades.forEach(g => {
      totalPoints += g.value * (g.coefficient || 1);
      totalCoefficients += (g.coefficient || 1);
    });
    return totalCoefficients > 0 ? Number((totalPoints / totalCoefficients).toFixed(2)) : 0;
  }

  private getAppreciationFromValue(value: number): string {
    if (value >= 18) return 'Excellent';
    if (value >= 16) return 'Très bien';
    if (value >= 14) return 'Bien';
    if (value >= 12) return 'Assez bien';
    if (value >= 10) return 'Passable';
    if (value >= 8) return 'Médiocre';
    return 'Insuffisant';
  }

  // ==================== BULLETIN PRINCIPAL ====================

  async getBulletin(studentId: string, trimester?: number) {
    const currentTrimester = trimester || 3;
    console.log(`📊 Génération du bulletin pour l'élève ${studentId}, trimestre: ${currentTrimester}`);

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          select: {
            id: true, name: true, level: true,
            mainTeacher: { select: { firstName: true, lastName: true } }
          }
        },
        grades: {
          where: { trimester: currentTrimester },
          include: {
            subject: {
              select: { id: true, name: true, color: true, category: true, coefficient: true }
            }
          },
          orderBy: { subject: { name: 'asc' } }
        },
        controls: {
          where: { trimester: currentTrimester },
          include: {
            subject: {
              select: { id: true, name: true, category: true, coefficient: true }
            }
          }
        },
        absences: true,
        punishments: { where: { trimester: currentTrimester } },
        bulletins: {
          where: {
            period: currentTrimester === 1 ? 'TRIMESTRE_1'
                  : currentTrimester === 2 ? 'TRIMESTRE_2'
                  : 'TRIMESTRE_3' as any
          }
        }
      }
    });

    if (!student) {
      throw new NotFoundException(`Élève avec ID ${studentId} non trouvé`);
    }

    // ── 1. Construire la map des matières depuis les grades ──────────────────
    const matieresMap = new Map<string, any>();

    student.grades.forEach(grade => {
      const subjectId = grade.subjectId;
      if (!matieresMap.has(subjectId)) {
        matieresMap.set(subjectId, {
          id: subjectId,
          nom: grade.subject.name,
          category: grade.subject.category || 'LITTERAIRE',
          coefficient: grade.subject.coefficient || 2,
          devoirs: [],
          interrogations: [],
          compositions: [],
          moyenne: grade.value,
        });
      } else {
        matieresMap.get(subjectId).moyenne = grade.value;
      }
    });

    // ── 2. Enrichir avec les détails contrôles ───────────────────────────────
    student.controls.forEach(control => {
      const subjectId = control.subjectId;

      if (!matieresMap.has(subjectId)) {
        matieresMap.set(subjectId, {
          id: subjectId,
          nom: control.subject.name,
          category: control.subject.category || 'LITTERAIRE',
          coefficient: control.subject.coefficient || 2,
          devoirs: [],
          interrogations: [],
          compositions: [],
          moyenne: 0,
        });
      }

      const m = matieresMap.get(subjectId);
      const t = control.type?.toUpperCase() || '';
      if (t === 'COMPOSITION' || t === 'EXAMEN') {
        m.compositions.push(control.value);
      } else if (t === 'DEVOIR' || t === 'DS') {
        m.devoirs.push(control.value);
      } else if (t === 'INTERROGATION' || t === 'INTERRO') {
        m.interrogations.push(control.value);
      } else {
        m.devoirs.push(control.value);
      }
    });

    // ── 3. Calculer la moyenne finale et les colonnes devoir/composition ─────
    const toutesMatieres: any[] = [];

    matieresMap.forEach(m => {
      if (m.devoirs.length > 0) {
        m.devoir = Number((m.devoirs.reduce((a: number, b: number) => a + b, 0) / m.devoirs.length).toFixed(2));
      } else {
        m.devoir = null;
      }

      if (m.compositions.length > 0) {
        m.composition = Number((m.compositions.reduce((a: number, b: number) => a + b, 0) / m.compositions.length).toFixed(2));
      } else {
        m.composition = null;
      }

      if (m.moyenne === 0 && (m.devoir !== null || m.composition !== null)) {
        let totalNotes = 0;
        let totalCoef = 0;
        if (m.devoir !== null) { totalNotes += m.devoir * 2; totalCoef += 2; }
        if (m.composition !== null) { totalNotes += m.composition * 3; totalCoef += 3; }
        if (m.interrogations.length > 0) {
          const interroAvg = m.interrogations.reduce((a: number, b: number) => a + b, 0) / m.interrogations.length;
          totalNotes += interroAvg;
          totalCoef += 1;
        }
        m.moyenne = totalCoef > 0 ? Number((totalNotes / totalCoef).toFixed(2)) : 0;
      }

      m.totalPoints = Number((m.moyenne * m.coefficient).toFixed(2));
      m.appreciation = this.getAppreciationFromValue(m.moyenne);

      if (m.moyenne > 0 || m.devoir !== null || m.composition !== null) {
        toutesMatieres.push(m);
      }
    });

    // ── 4. Séparer par catégorie ─────────────────────────────────────────────
    const matieresLitteraires = toutesMatieres.filter(m => m.category === 'LITTERAIRE');
    const matieresScientifiques = toutesMatieres.filter(m => m.category === 'SCIENTIFIQUE');

    // ── 5. Calculer les bilans ───────────────────────────────────────────────
    const calculerBilan = (matieres: any[]) => {
      if (matieres.length === 0) return {
        noteMax: 0, bilanDevoir: null, bilanComposition: null,
        totalCoef: 0, totalPoints: 0, moyenne: 0
      };

      const noteMax = matieres.length * 20;
      const totalCoef = matieres.reduce((acc, m) => acc + m.coefficient, 0);
      const totalPoints = matieres.reduce((acc, m) => acc + m.totalPoints, 0);

      const devoirsValides = matieres.filter(m => m.devoir !== null);
      const compoValides = matieres.filter(m => m.composition !== null);

      const bilanDevoir = devoirsValides.length > 0
        ? Number(devoirsValides.reduce((acc, m) => acc + m.devoir, 0).toFixed(2))
        : null;
      const bilanComposition = compoValides.length > 0
        ? Number(compoValides.reduce((acc, m) => acc + m.composition, 0).toFixed(2))
        : null;

      const moyenne = totalCoef > 0 ? Number((totalPoints / totalCoef).toFixed(2)) : 0;

      return { noteMax, bilanDevoir, bilanComposition, totalCoef, totalPoints: Number(totalPoints.toFixed(2)), moyenne };
    };

    const bilanLitteraire = calculerBilan(matieresLitteraires);
    const bilanScientifique = calculerBilan(matieresScientifiques);

    // ── 6. Note de conduite (manuelle) ──────────────────────────────────────
    const conduiteData = await this.getConduiteNote(studentId, currentTrimester);
    const noteConduite = conduiteData.note ?? 0; // si non définie, on met 0 par défaut
    const appreciationConduite = noteConduite > 0 ? this.getAppreciationFromValue(noteConduite) : 'Non évaluée';

    // ── 7. Total général ─────────────────────────────────────────────────────
    const totalCoefGeneral = bilanLitteraire.totalCoef + bilanScientifique.totalCoef + 1;
    const totalPointsGeneral = Number(
      (bilanLitteraire.totalPoints + bilanScientifique.totalPoints + noteConduite).toFixed(2)
    );
    const noteMaxTotal = bilanLitteraire.noteMax + bilanScientifique.noteMax + 20;

    // ── 8. Moyenne générale ──────────────────────────────────────────────────
    const moyenneGenerale = totalCoefGeneral > 0
      ? Number((totalPointsGeneral / totalCoefGeneral).toFixed(2))
      : 0;

    // ── 9. Rang dans la classe ───────────────────────────────────────────────
    const rang = await this.calculerRang(studentId, student.classId, currentTrimester);

    // ── 10. Moyennes des 3 trimestres ────────────────────────────────────────
    const allGrades = await this.prisma.grade.findMany({
      where: { studentId },
      include: { subject: { select: { coefficient: true } } }
    });

    const calcMoyTrimestre = (t: number) => {
      const gs = allGrades.filter(g => g.trimester === t);
      if (gs.length === 0) return null;
      const totalPts = gs.reduce((acc, g) => acc + g.value * (g.coefficient || g.subject?.coefficient || 1), 0);
      const totalCoef = gs.reduce((acc, g) => acc + (g.coefficient || g.subject?.coefficient || 1), 0);
      return totalCoef > 0 ? Number((totalPts / totalCoef).toFixed(2)) : null;
    };

    const trimestreAverages = {
      trimestre1: calcMoyTrimestre(1),
      trimestre2: calcMoyTrimestre(2),
      trimestre3: calcMoyTrimestre(3)
    };

    const moyennesValides = [
      trimestreAverages.trimestre1,
      trimestreAverages.trimestre2,
      trimestreAverages.trimestre3
    ].filter((m): m is number => m !== null && m > 0);

    const annuelle = moyennesValides.length > 0
      ? Number((moyennesValides.reduce((a, b) => a + b, 0) / moyennesValides.length).toFixed(2))
      : moyenneGenerale;

    // ── 11. Absences du trimestre ────────────────────────────────────────────
    const totalAbsences = student.absences.filter(a => this.isAbsenceInTrimester(a, currentTrimester)).length;

    // ── 12. Appréciation générale ────────────────────────────────────────────
    let appreciationGenerale = '';
    if (moyenneGenerale >= 16) appreciationGenerale = 'Excellent travail. Félicitations ! Tableau d\'honneur.';
    else if (moyenneGenerale >= 14) appreciationGenerale = 'Très bon travail. Encouragement.';
    else if (moyenneGenerale >= 12) appreciationGenerale = 'Bon travail. Continuez ainsi.';
    else if (moyenneGenerale >= 10) appreciationGenerale = 'Assez bon travail. Peut mieux faire.';
    else appreciationGenerale = 'Des efforts sont nécessaires.';

    let tableauHonneur = '-';
    if (moyenneGenerale >= 16) tableauHonneur = 'Félicitations';
    else if (moyenneGenerale >= 14) tableauHonneur = 'Encouragement';

    // ── 13. Résultat final ───────────────────────────────────────────────────
    return {
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        registrationNo: student.registrationNo,
        class: student.class
      },
      trimester: currentTrimester,
      period: `TRIMESTRE_${currentTrimester}`,
      matieres: toutesMatieres.map(m => ({
        id: m.id,
        nom: m.nom,
        moyenne: m.moyenne,
        devoir: m.devoir,
        composition: m.composition,
        coefficient: m.coefficient,
        categorie: m.category,
        appreciation: m.appreciation,
        totalPoints: m.totalPoints
      })),
      bilans: {
        litteraire: bilanLitteraire,
        scientifique: bilanScientifique
      },
      moyennes: {
        litteraire: bilanLitteraire.moyenne,
        scientifique: bilanScientifique.moyenne,
        generale: moyenneGenerale,
        conduite: noteConduite
      },
      total: {
        noteMax: noteMaxTotal,
        totalCoef: totalCoefGeneral,
        totalPoints: totalPointsGeneral
      },
      conduite: {
        note: noteConduite,
        appreciation: appreciationConduite,
        punitions: student.punishments.map(p => ({
          id: p.id,
          hours: p.hours,
          reason: p.reason,
          date: p.date
        })),
        totalHeuresColle: student.punishments.reduce((acc, p) => acc + p.hours, 0),
      },
      trimestres: trimestreAverages,
      annuelle,
      rang: { position: rang.position, total: rang.total },
      absences: totalAbsences,
      generalAverage: moyenneGenerale,
      appreciation: appreciationGenerale,
      tableauHonneur,
      generatedAt: new Date().toISOString()
    };
  }

  // ==================== RAPPORT ====================

  async getStudentReport(studentId: string, period: Period) {
    let trimester = 3;
    if (period === 'TRIMESTRE_1') trimester = 1;
    else if (period === 'TRIMESTRE_2') trimester = 2;
    return this.getBulletin(studentId, trimester);
  }

  // ==================== HELPERS PRIVÉS ====================

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
      include: {
        grades: trimester ? { where: { trimester } } : true
      }
    });

    const averages = students.map(s => {
      const grades = s.grades || [];
      if (grades.length === 0) return { studentId: s.id, average: 0 };
      const totalPoints = grades.reduce((acc, g) => acc + (g.value * (g.coefficient || 1)), 0);
      const totalCoef = grades.reduce((acc, g) => acc + (g.coefficient || 1), 0);
      return { studentId: s.id, average: totalCoef > 0 ? totalPoints / totalCoef : 0 };
    }).sort((a, b) => b.average - a.average);

    const position = averages.findIndex(s => s.studentId === studentId) + 1;
    return { position, total: students.length };
  }

  calculateSubjectAverages(grades: any[], period: Period) {
    const periodGrades = grades.filter(g => g.period === period);
    const subjectsMap = new Map();

    periodGrades.forEach(grade => {
      if (grade.subject) {
        const subjectId = grade.subject.id;
        if (!subjectsMap.has(subjectId)) {
          subjectsMap.set(subjectId, {
            subjectId,
            subject: grade.subject.name,
            color: grade.subject.color || '#3498db',
            grades: [],
            totalPoints: 0,
            totalCoefficients: 0
          });
        }
        const sd = subjectsMap.get(subjectId);
        sd.grades.push(grade.value);
        sd.totalPoints += grade.value * (grade.coefficient || 1);
        sd.totalCoefficients += (grade.coefficient || 1);
      }
    });

    const result: any[] = [];
    subjectsMap.forEach(data => {
      result.push({
        subjectId: data.subjectId,
        subject: data.subject,
        color: data.color,
        average: data.totalCoefficients > 0
          ? Number((data.totalPoints / data.totalCoefficients).toFixed(2))
          : 0,
        grades: data.grades,
        coefficient: data.totalCoefficients / data.grades.length
      });
    });
    return result;
  }
}