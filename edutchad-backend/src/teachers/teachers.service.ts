// src/teachers/teachers.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Créer un professeur (avec gestion doublon email)
  // ─────────────────────────────────────────────────────────────────────────
  async create(data: any) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email, isDeleted: false },
      include: { teacherProfile: true },
    });

    if (existingUser) {
      const teacherCreatedAt =
        existingUser.teacherProfile?.createdAt || existingUser.createdAt;
      const timeAgo = this.timeSince(teacherCreatedAt);
      throw new ConflictException(
        `Un compte existe déjà avec cet email. Un email a été envoyé il y a ${timeAgo}.`,
      );
    }

    const generatedPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          role: Role.TEACHER,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          specialty: data.specialty || null,
          photo: data.photo || null,
        },
      });

      try {
        await this.emailService.sendWelcomeEmail(
          data.email,
          data.firstName,
          data.lastName,
          generatedPassword,
        );
      } catch (emailError) {
        console.error(`Erreur envoi email à ${data.email}:`, emailError);
      }

      if (data.subjectIds?.length) {
        await tx.teacher.update({
          where: { id: teacher.id },
          data: {
            subjects: { connect: data.subjectIds.map((id: string) => ({ id })) },
          },
        });
      }

      return {
        ...teacher,
        message: 'Professeur créé avec succès. Un email a été envoyé.',
        emailSent: true,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Lister tous les professeurs actifs (exclure soft delete)
  //    Ajout du champ distinctClassesCount (classes uniques)
  // ─────────────────────────────────────────────────────────────────────────
  async findAll() {
    const teachers = await this.prisma.teacher.findMany({
      where: { isDeleted: false },
      include: {
        user: { select: { email: true, isActive: true, createdAt: true } },
        mainClass: {
          select: {
            id: true,
            name: true,
            level: true,
            _count: { select: { students: true } },
          },
        },
        subjects: { select: { id: true, name: true, color: true } },
        courses: {
          include: {
            class: { select: { id: true, name: true, level: true } },
            subject: { select: { id: true, name: true } },
          },
        },
        _count: { select: { courses: true, subjects: true } },
      },
      orderBy: { lastName: 'asc' },
    });

    return teachers.map((teacher) => {
      const distinctClassIds = new Set(teacher.courses.map((c) => c.classId));
      return {
        ...teacher,
        distinctClassesCount: distinctClassIds.size,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Récupérer un professeur actif par ID
  // ─────────────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id, isDeleted: false },
      include: {
        user: { select: { email: true, isActive: true, createdAt: true } },
        mainClass: {
          select: {
            id: true,
            name: true,
            level: true,
            _count: { select: { students: true } },
          },
        },
        subjects: { select: { id: true, name: true, color: true } },
        courses: {
          include: {
            class: { select: { id: true, name: true, level: true } },
            subject: { select: { id: true, name: true, color: true } },
          },
        },
        _count: { select: { courses: true, subjects: true } },
      },
    });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${id} non trouvé`);

    const distinctClassIds = new Set(teacher.courses.map((c) => c.classId));
    return {
      ...teacher,
      distinctClassesCount: distinctClassIds.size,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Détails complets d'un professeur (y compris supprimés – usage admin)
  // ─────────────────────────────────────────────────────────────────────────
  async getDetails(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, createdAt: true, isActive: true } },
        mainClass: { include: { _count: { select: { students: true } } } },
        subjects: { select: { id: true, name: true, color: true } },
        courses: {
          include: {
            subject: { select: { id: true, name: true, color: true } },
            class: { select: { id: true, name: true, level: true } },
          },
        },
        salaries: { orderBy: { month: 'desc' }, take: 5 },
      },
    });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${id} non trouvé`);

    const distinctClassIds = new Set(teacher.courses.map((c) => c.classId));
    return {
      ...teacher,
      distinctClassesCount: distinctClassIds.size,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Lister les professeurs supprimés (corbeille)
  //    Renvoie TOUTES les informations nécessaires à l'affichage dans la corbeille
  // ─────────────────────────────────────────────────────────────────────────
  async findDeleted() {
    const teachers = await this.prisma.teacher.findMany({
      where: { isDeleted: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
        mainClass: {
          select: { id: true, name: true, level: true },
        },
        subjects: {
          select: { id: true, name: true, color: true },
        },
        courses: {
          include: {
            class: { select: { id: true, name: true, level: true } },
            subject: { select: { id: true, name: true, color: true } },
          },
        },
        _count: {
          select: { courses: true, subjects: true, salaries: true },
        },
      },
      orderBy: { deletedAt: 'desc' },
    });

    return teachers.map((teacher) => {
      const distinctClassIds = new Set(teacher.courses.map((c) => c.classId));
      return {
        ...teacher,
        distinctClassesCount: distinctClassIds.size,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Soft delete d'un professeur (mise en corbeille)
  // ─────────────────────────────────────────────────────────────────────────
  async softDelete(id: string, deletedBy: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { mainClass: true, user: true },
    });
    if (!teacher) throw new NotFoundException('Professeur non trouvé');
    if (teacher.isDeleted) throw new BadRequestException('Professeur déjà supprimé');
    if (teacher.mainClass) {
      throw new BadRequestException(
        "Impossible de supprimer un professeur principal. Retirez d'abord son rôle.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.teacher.update({
        where: { id },
        data: { isDeleted: true, deletedAt: now, deletedBy },
      });
      await tx.user.update({
        where: { id: teacher.userId },
        data: { isDeleted: true, deletedAt: now, deletedBy },
      });
      return { message: 'Professeur déplacé vers la corbeille avec succès' };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Restaurer un professeur depuis la corbeille
  // ─────────────────────────────────────────────────────────────────────────
  async restore(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!teacher) throw new NotFoundException('Professeur non trouvé');
    if (!teacher.isDeleted)
      throw new BadRequestException("Ce professeur n'est pas dans la corbeille");

    return this.prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id },
        data: { isDeleted: false, deletedAt: null, deletedBy: null },
      });
      await tx.user.update({
        where: { id: teacher.userId },
        data: { isDeleted: false, deletedAt: null, deletedBy: null },
      });
      return {
        message: `Le professeur ${teacher.firstName} ${teacher.lastName} a été restauré avec succès`,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Mettre à jour un professeur
  // ─────────────────────────────────────────────────────────────────────────
  async update(id: string, data: any) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${id} non trouvé`);

    return this.prisma.teacher.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        specialty: data.specialty,
        photo: data.photo,
      },
      include: {
        user: { select: { email: true } },
        subjects: true,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Assigner une classe principale
  // ─────────────────────────────────────────────────────────────────────────
  async assignMainClass(teacherId: string, classId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Professeur non trouvé');

    const classe = await this.prisma.class.findFirst({
      where: {
        id: classId,
        isDeleted: false,
        schoolYear: { isActive: true },
      },
      include: { mainTeacher: true },
    });
    if (!classe)
      throw new NotFoundException('Classe introuvable, archivée ou hors année scolaire active');

    if (classe.mainTeacher && classe.mainTeacher.id !== teacherId) {
      throw new ConflictException('Cette classe a déjà un professeur principal');
    }

    return this.prisma.$transaction(async (tx) => {
      if (classe.mainTeacher && classe.mainTeacher.id !== teacherId) {
        await tx.teacher.update({
          where: { id: classe.mainTeacher.id },
          data: { mainClass: { disconnect: true } },
        });
      }
      return tx.teacher.update({
        where: { id: teacherId },
        data: { mainClass: { connect: { id: classId } } },
        include: { mainClass: true },
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 10. Retirer la classe principale
  // ─────────────────────────────────────────────────────────────────────────
  async removeMainClass(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { mainClass: true },
    });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    if (!teacher.mainClass) {
      throw new BadRequestException("Ce professeur n'est pas professeur principal");
    }
    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { mainClass: { disconnect: true } },
      include: { mainClass: true, subjects: true },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 11. Assigner des matières
  // ─────────────────────────────────────────────────────────────────────────
  async assignSubjects(teacherId: string, subjectIds: string[]) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { subjects: true },
    });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);

    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });
    if (subjects.length !== subjectIds.length) {
      throw new NotFoundException("Une ou plusieurs matières n'existent pas");
    }

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { subjects: { set: subjectIds.map((id) => ({ id })) } },
      include: {
        user: { select: { email: true } },
        mainClass: true,
        subjects: true,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 12. Retirer une matière spécifique
  // ─────────────────────────────────────────────────────────────────────────
  async removeSubject(teacherId: string, subjectId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { subjects: { where: { id: subjectId } } },
    });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    if (teacher.subjects.length === 0) {
      throw new BadRequestException("Ce professeur n'enseigne pas cette matière");
    }
    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { subjects: { disconnect: { id: subjectId } } },
      include: { subjects: true },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 13. Assigner une classe (créer un cours)
  // ─────────────────────────────────────────────────────────────────────────
  async assignClass(
    teacherId: string,
    data: { classId: string; subjectId: string; coefficient?: number },
  ) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Professeur non trouvé');

    const classe = await this.prisma.class.findFirst({
      where: { id: data.classId, isDeleted: false, schoolYear: { isActive: true } },
    });
    if (!classe) throw new NotFoundException('Classe non trouvée ou non active');

    const subject = await this.prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject) throw new NotFoundException('Matière non trouvée');

    const existing = await this.prisma.course.findFirst({
      where: { teacherId, classId: data.classId, subjectId: data.subjectId },
    });
    if (existing)
      throw new ConflictException(
        'Ce professeur enseigne déjà cette matière dans cette classe',
      );

    return this.prisma.course.create({
      data: {
        teacherId,
        classId: data.classId,
        subjectId: data.subjectId,
        coefficient: data.coefficient || 1,
      },
      include: { class: true, subject: true },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 14. Retirer une classe (supprimer un cours)
  // ─────────────────────────────────────────────────────────────────────────
  async removeClass(teacherId: string, classId: string, subjectId: string) {
    const course = await this.prisma.course.findFirst({
      where: { teacherId, classId, subjectId },
    });
    if (!course) throw new NotFoundException("Ce cours n'existe pas");
    return this.prisma.course.delete({ where: { id: course.id } });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 15. Retirer toutes les classes d'un professeur
  // ─────────────────────────────────────────────────────────────────────────
  async removeAllClasses(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    return this.prisma.course.deleteMany({ where: { teacherId } });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 16. Changer le mot de passe (avec envoi d'email)
  // ─────────────────────────────────────────────────────────────────────────
  async changePassword(teacherId: string, newPassword?: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);

    const password = newPassword || this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: teacher.userId },
      data: { passwordHash: hashedPassword },
    });

    try {
      await this.emailService.sendPasswordResetEmail(
        teacher.user.email,
        teacher.firstName,
        teacher.lastName,
        password,
      );
    } catch (emailError) {
      console.error(`Erreur envoi email à ${teacher.user.email}:`, emailError);
    }

    return {
      message: 'Mot de passe modifié avec succès. Un email a été envoyé au professeur.',
      emailSent: true,
      generatedPassword: !newPassword ? password : undefined,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 17. Réinitialiser le mot de passe (génération automatique)
  // ─────────────────────────────────────────────────────────────────────────
  async resetPassword(teacherId: string) {
    return this.changePassword(teacherId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 18. Suppression définitive (hard delete)
  // ─────────────────────────────────────────────────────────────────────────
  async hardDelete(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true, courses: true, mainClass: true },
    });
    if (!teacher) throw new NotFoundException('Professeur non trouvé');
    if (!teacher.isDeleted) {
      throw new BadRequestException(
        "Le professeur doit être mis en corbeille avant d'être supprimé définitivement",
      );
    }
    if (teacher.mainClass) {
      throw new BadRequestException('Retirez d\'abord le rôle de professeur principal');
    }

    return this.prisma.$transaction(async (tx) => {
      if (teacher.courses.length > 0) {
        await tx.course.deleteMany({ where: { teacherId: id } });
      }
      await tx.teacher.delete({ where: { id } });
      await tx.user.delete({ where: { id: teacher.userId } });
      return { message: 'Professeur supprimé définitivement' };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 19. Compter les professeurs principaux
  // ─────────────────────────────────────────────────────────────────────────
  async getPrincipalsCount() {
    return this.prisma.teacher.count({
      where: { mainClass: { isNot: null }, isDeleted: false },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 20. Récupérer le profil du professeur connecté
  // ─────────────────────────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, isActive: true, createdAt: true } },
        mainClass: {
          select: {
            id: true,
            name: true,
            level: true,
            _count: { select: { students: true } },
          },
        },
        subjects: { select: { id: true, name: true, color: true } },
      },
    });
    if (!teacher) throw new NotFoundException('Professeur non trouvé');
    return {
      ...teacher,
      isHeadTeacher: teacher.mainClass !== null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 21. Récupérer les cours d'un professeur
  // ─────────────────────────────────────────────────────────────────────────
  async getTeacherCourses(teacherId: string) {
    return this.prisma.course.findMany({
      where: { teacherId },
      include: {
        class: { select: { id: true, name: true, level: true } },
        subject: { select: { id: true, name: true, color: true } },
        scheduleSlots: { take: 1, orderBy: { dayOfWeek: 'asc' } },
      },
      orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' } }],
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 22. Récupérer la classe principale
  // ─────────────────────────────────────────────────────────────────────────
  async getMainClass(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { mainClass: { include: { _count: { select: { students: true } } } } },
    });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    return teacher.mainClass;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 23. Récupérer les élèves de la classe principale
  // ─────────────────────────────────────────────────────────────────────────
  async getClassStudents(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        mainClass: {
          include: {
            students: {
              include: {
                user: { select: { email: true } },
                _count: { select: { absences: true, grades: true } },
                grades: {
                  select: {
                    value: true,
                    trimester: true,
                    coefficient: true,
                    subject: { select: { name: true } },
                  },
                },
              },
              orderBy: { lastName: 'asc' },
            },
          },
        },
      },
    });

    if (!teacher || !teacher.mainClass) {
      throw new NotFoundException('Aucune classe principale trouvée');
    }

    const students = teacher.mainClass.students.map((student) => {
      const grades = student.grades || [];
      return {
        ...student,
        averages: {
          trimestre1: this.calculateTrimesterAverage(grades, 1),
          trimestre2: this.calculateTrimesterAverage(grades, 2),
          trimestre3: this.calculateTrimesterAverage(grades, 3),
          annuelle: this.calculateYearlyAverage(grades),
        },
        _count: student._count,
      };
    });

    return {
      class: {
        id: teacher.mainClass.id,
        name: teacher.mainClass.name,
        level: teacher.mainClass.level,
      },
      students,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 24. Mettre à jour le profil d'un professeur
  // ─────────────────────────────────────────────────────────────────────────
  async updateProfile(teacherId: string, data: any) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        specialty: data.specialty,
        photo: data.photo,
      },
      include: { user: { select: { email: true } } },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 25. Mettre à jour la photo
  // ─────────────────────────────────────────────────────────────────────────
  async updatePhoto(teacherId: string, photoUrl: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { photo: photoUrl },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 26. Trouver un professeur par email
  // ─────────────────────────────────────────────────────────────────────────
  async findByEmail(email: string) {
    return this.prisma.teacher.findFirst({
      where: { user: { email } },
      include: { mainClass: true, user: true },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 27. Élèves par classId (pour professeur principal)
  // ─────────────────────────────────────────────────────────────────────────
  async getStudentsByClassId(classId: string) {
    const students = await this.prisma.student.findMany({
      where: { classId },
      include: {
        user: { select: { email: true } },
        _count: { select: { absences: true, grades: true } },
        grades: {
          select: {
            value: true,
            trimester: true,
            coefficient: true,
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return students.map((student) => {
      const grades = student.grades || [];
      return {
        ...student,
        averages: {
          trimestre1: this.calculateTrimesterAverage(grades, 1),
          trimestre2: this.calculateTrimesterAverage(grades, 2),
          trimestre3: this.calculateTrimesterAverage(grades, 3),
          annuelle: this.calculateYearlyAverage(grades),
        },
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 28. Classes actives (année scolaire en cours, non archivées)
  // ─────────────────────────────────────────────────────────────────────────
  async findAllActiveClasses() {
    return this.prisma.class.findMany({
      where: {
        isDeleted: false,
        schoolYear: { isActive: true },
      },
      include: {
        _count: { select: { students: true } },
        mainTeacher: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITAIRES PRIVÉS
  // ═══════════════════════════════════════════════════════════════════════

  private generateRandomPassword(length: number = 10): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private calculateTrimesterAverage(grades: any[], trimester: number): number {
    const trimesterGrades = grades.filter((g) => g.trimester === trimester);
    if (trimesterGrades.length === 0) return 0;
    const totalPoints = trimesterGrades.reduce(
      (acc, g) => acc + g.value * (g.coefficient || 1),
      0,
    );
    const totalCoef = trimesterGrades.reduce((acc, g) => acc + (g.coefficient || 1), 0);
    return totalCoef > 0 ? Number((totalPoints / totalCoef).toFixed(2)) : 0;
  }

  private calculateYearlyAverage(grades: any[]): number {
    const trim1 = this.calculateTrimesterAverage(grades, 1);
    const trim2 = this.calculateTrimesterAverage(grades, 2);
    const trim3 = this.calculateTrimesterAverage(grades, 3);
    const valid = [trim1, trim2, trim3].filter((v) => v > 0);
    if (valid.length === 0) return 0;
    return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2));
  }

  private timeSince(date: Date): string {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    const intervals = [
      { label: 'an', seconds: 31_536_000 },
      { label: 'mois', seconds: 2_592_000 },
      { label: 'jour', seconds: 86_400 },
      { label: 'heure', seconds: 3_600 },
      { label: 'minute', seconds: 60 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `il y a ${count} ${interval.label}${count > 1 ? 's' : ''}`;
      }
    }
    return 'quelques secondes';
  }
}