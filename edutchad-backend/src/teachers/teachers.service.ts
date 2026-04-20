// src/teachers/teachers.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  // ==================== MÉTHODES POUR ADMIN ====================

  // 1. Créer un professeur avec envoi d'email
  async create(data: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
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
          generatedPassword
        );
        console.log(`✅ Email envoyé à ${data.email}`);
      } catch (emailError) {
        console.error(`❌ Erreur envoi email à ${data.email}:`, emailError);
      }

      if (data.subjectIds && data.subjectIds.length > 0) {
        await tx.teacher.update({
          where: { id: teacher.id },
          data: {
            subjects: {
              connect: data.subjectIds.map((id: string) => ({ id }))
            }
          }
        });
      }

      const createdTeacher = await tx.teacher.findUnique({
        where: { id: teacher.id },
        include: {
          subjects: true,
          user: {
            select: { email: true }
          }
        }
      });

      return {
        ...createdTeacher,
        message: 'Professeur créé avec succès. Un email a été envoyé avec les identifiants.',
        emailSent: true
      };
    });
  }

  // 2. Lister tous les professeurs
  async findAll() {
    return this.prisma.teacher.findMany({
      include: {
        user: {
          select: { 
            email: true, 
            isActive: true,
            createdAt: true 
          }
        },
        mainClass: {
          select: {
            id: true,
            name: true,
            level: true,
            _count: {
              select: { students: true }
            }
          }
        },
        subjects: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        courses: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                level: true
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
        },
        _count: {
          select: {
            courses: true,
            subjects: true
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    });
  }

  // 3. Trouver un professeur par ID
  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: { 
            email: true, 
            isActive: true,
            createdAt: true 
          }
        },
        mainClass: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        },
        subjects: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        courses: {
          include: {
            subject: true,
            class: true
          }
        },
        _count: {
          select: {
            courses: true,
            subjects: true
          }
        }
      }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${id} non trouvé`);
    }

    return teacher;
  }

  // 4. Détails complets
  async getDetails(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            createdAt: true,
            isActive: true
          }
        },
        mainClass: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        },
        subjects: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        courses: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            class: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          }
        },
        salaries: {
          orderBy: {
            month: 'desc'
          },
          take: 5
        }
      }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${id} non trouvé`);
    }

    return teacher;
  }

  // 5. Mettre à jour un professeur
  async update(id: string, data: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${id} non trouvé`);
    }

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
        user: {
          select: { email: true }
        },
        subjects: true
      }
    });
  }

  // 6. Assigner une classe principale
  async assignMainClass(teacherId: string, classId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    }

    const classe = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        mainTeacher: true  // Inclure le professeur principal actuel
      }
    });

    if (!classe) {
      throw new NotFoundException(`Classe avec ID ${classId} non trouvée`);
    }

    // Vérifier si la classe a déjà un professeur principal
    if (classe.mainTeacher && classe.mainTeacher.id !== teacherId) {
      throw new ConflictException('Cette classe a déjà un professeur principal');
    }

    return this.prisma.$transaction(async (tx) => {
      // Retirer l'ancien professeur principal de cette classe si nécessaire
      if (classe.mainTeacher && classe.mainTeacher.id !== teacherId) {
        await tx.teacher.update({
          where: { id: classe.mainTeacher.id },
          data: { mainClassId: null }
        });
      }

      // Assigner le nouveau professeur principal
      const updatedTeacher = await tx.teacher.update({
        where: { id: teacherId },
        data: {
          mainClass: {
            connect: { id: classId }
          }
        },
        include: {
          mainClass: true,
          subjects: true
        }
      });

      return updatedTeacher;
    });
  }

  // 7. Retirer la classe principale
  async removeMainClass(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        mainClass: true
      }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    }

    if (!teacher.mainClass) {
      throw new BadRequestException('Ce professeur n\'est pas professeur principal');
    }

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        mainClass: {
          disconnect: true
        }
      },
      include: {
        mainClass: true,
        subjects: true
      }
    });
  }

  // 8. Assigner des matières
  async assignSubjects(teacherId: string, subjectIds: string[]) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        subjects: true
      }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    }

    const subjects = await this.prisma.subject.findMany({
      where: {
        id: { in: subjectIds }
      }
    });

    if (subjects.length !== subjectIds.length) {
      throw new NotFoundException('Une ou plusieurs matières n\'existent pas');
    }

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        subjects: {
          set: subjectIds.map(id => ({ id }))
        }
      },
      include: {
        user: {
          select: { email: true }
        },
        mainClass: true,
        subjects: true
      }
    });
  }

  // 9. Retirer une matière spécifique
  async removeSubject(teacherId: string, subjectId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        subjects: {
          where: { id: subjectId }
        }
      }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    }

    if (teacher.subjects.length === 0) {
      throw new BadRequestException('Ce professeur n\'enseigne pas cette matière');
    }

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        subjects: {
          disconnect: { id: subjectId }
        }
      },
      include: {
        subjects: true
      }
    });
  }

  // 10. Supprimer un professeur
  async delete(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courses: true
          }
        }
      }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${id} non trouvé`);
    }

    if (teacher._count.courses > 0) {
      throw new BadRequestException('Impossible de supprimer un professeur qui a des cours assignés');
    }

    if (teacher.mainClassId) {
      throw new BadRequestException('Impossible de supprimer un professeur qui est professeur principal');
    }

    return this.prisma.$transaction(async (tx) => {
      // Supprimer d'abord le teacher
      await tx.teacher.delete({
        where: { id }
      });

      // Puis supprimer l'utilisateur associé
      await tx.user.delete({
        where: { id: teacher.userId }
      });

      return { message: 'Professeur supprimé avec succès' };
    });
  }

  // 11. Compter les professeurs principaux
  async getPrincipalsCount() {
    return this.prisma.teacher.count({
      where: {
        mainClassId: { not: null }
      }
    });
  }

  // 12. Changer le mot de passe avec envoi d'email
  async changePassword(teacherId: string, newPassword?: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { 
        user: true 
      }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    }

    // Générer un mot de passe aléatoire si non fourni
    const password = newPassword || this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: teacher.userId },
      data: { passwordHash: hashedPassword }
    });

    try {
      await this.emailService.sendPasswordResetEmail(
        teacher.user.email,
        teacher.firstName,
        teacher.lastName,
        password
      );
      console.log(`✅ Email de réinitialisation envoyé à ${teacher.user.email}`);
    } catch (emailError) {
      console.error(`❌ Erreur envoi email à ${teacher.user.email}:`, emailError);
    }

    return {
      message: 'Mot de passe modifié avec succès. Un email a été envoyé au professeur.',
      emailSent: true,
      generatedPassword: !newPassword ? password : undefined
    };
  }

  // 13. Réinitialiser le mot de passe (génère un nouveau mot de passe)
  async resetPassword(teacherId: string) {
    return this.changePassword(teacherId);
  }

  // ==================== MÉTHODES POUR LES COURS ====================

  // 14. Assigner une classe (créer un cours)
  async assignClass(teacherId: string, data: { classId: string; subjectId: string; coefficient?: number }) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    }

    const classe = await this.prisma.class.findUnique({
      where: { id: data.classId }
    });

    if (!classe) {
      throw new NotFoundException(`Classe avec ID ${data.classId} non trouvée`);
    }

    const subject = await this.prisma.subject.findUnique({
      where: { id: data.subjectId }
    });

    if (!subject) {
      throw new NotFoundException(`Matière avec ID ${data.subjectId} non trouvée`);
    }

    // Vérifier si le professeur enseigne déjà cette matière dans cette classe
    const existingCourse = await this.prisma.course.findFirst({
      where: {
        teacherId,
        classId: data.classId,
        subjectId: data.subjectId
      }
    });

    if (existingCourse) {
      throw new ConflictException('Ce professeur enseigne déjà cette matière dans cette classe');
    }

    return this.prisma.course.create({
      data: {
        teacherId,
        classId: data.classId,
        subjectId: data.subjectId,
        coefficient: data.coefficient || 1
      },
      include: {
        class: true,
        subject: true
      }
    });
  }

  // 15. Retirer une classe (supprimer un cours)
  async removeClass(teacherId: string, classId: string, subjectId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        teacherId,
        classId,
        subjectId
      }
    });

    if (!course) {
      throw new NotFoundException('Ce cours n\'existe pas');
    }

    return this.prisma.course.delete({
      where: { id: course.id }
    });
  }

  // 16. Retirer toutes les classes d'un professeur
  async removeAllClasses(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    }

    return this.prisma.course.deleteMany({
      where: { teacherId }
    });
  }

  // ==================== MÉTHODES POUR LE PROFESSEUR CONNECTÉ ====================

  // 17. Récupérer le profil du professeur connecté
  async getProfile(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            createdAt: true
          }
        },
        mainClass: {
          select: {
            id: true,
            name: true,
            level: true,
            _count: {
              select: { students: true }
            }
          }
        },
        subjects: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    if (!teacher) {
      throw new NotFoundException('Professeur non trouvé');
    }

   return {
    ...teacher,
    isHeadTeacher: teacher.mainClass !== null
  };
  }

  // 18. Récupérer les cours d'un professeur
  async getTeacherCourses(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        scheduleSlots: {
          take: 1,
          orderBy: {
            dayOfWeek: 'asc'
          }
        }
      },
      orderBy: [
        { class: { name: 'asc' } },
        { subject: { name: 'asc' } }
      ]
    });

    return courses;
  }

  // 19. Récupérer la classe principale d'un professeur
  async getMainClass(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        mainClass: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        }
      }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    }

    return teacher.mainClass;
  }

  // 20. Récupérer les élèves de la classe principale
  async getClassStudents(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        mainClass: {
          include: {
            students: {
              include: {
                user: {
                  select: {
                    email: true
                  }
                },
                _count: {
                  select: {
                    absences: true,
                    grades: true
                  }
                },
                grades: {
                  select: {
                    value: true,
                    trimester: true,
                    coefficient: true,
                    subject: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                lastName: 'asc'
              }
            }
          }
        }
      }
    });

    if (!teacher || !teacher.mainClass) {
      throw new NotFoundException('Aucune classe principale trouvée');
    }

    const students = teacher.mainClass.students.map(student => {
      const grades = student.grades || [];
      
      const averages = {
        trimestre1: this.calculateTrimesterAverage(grades, 1),
        trimestre2: this.calculateTrimesterAverage(grades, 2),
        trimestre3: this.calculateTrimesterAverage(grades, 3),
        annuelle: this.calculateYearlyAverage(grades)
      };

      return {
        ...student,
        averages,
        _count: student._count
      };
    });

    return {
      class: {
        id: teacher.mainClass.id,
        name: teacher.mainClass.name,
        level: teacher.mainClass.level
      },
      students
    };
  }

  // 21. Mettre à jour le profil
  async updateProfile(teacherId: string, data: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    }

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        specialty: data.specialty,
        photo: data.photo,
      },
      include: {
        user: {
          select: { email: true }
        }
      }
    });
  }

  // 22. Mettre à jour la photo
  async updatePhoto(teacherId: string, photoUrl: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    }

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { photo: photoUrl }
    });
  }

  // ==================== FONCTIONS UTILITAIRES ====================

  private generateRandomPassword(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private calculateTrimesterAverage(grades: any[], trimester: number): number {
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

  private calculateYearlyAverage(grades: any[]): number {
    const trim1 = this.calculateTrimesterAverage(grades, 1);
    const trim2 = this.calculateTrimesterAverage(grades, 2);
    const trim3 = this.calculateTrimesterAverage(grades, 3);
    
    const validTrimestres = [trim1, trim2, trim3].filter(v => v > 0);
    if (validTrimestres.length === 0) return 0;
    
    const sum = validTrimestres.reduce((a, b) => a + b, 0);
    return Number((sum / validTrimestres.length).toFixed(2));
  }
 async findByEmail(email: string) {
    return this.prisma.teacher.findFirst({
        where: { user: { email: email } },
        include: { 
          mainClass: true, // Indispensable pour savoir s'il est titulaire
          user: true 
        }
    });
}
async getStudentsByClassId(classId: string) {
    const students = await this.prisma.student.findMany({
      where: { classId },
      include: {
        user: { select: { email: true } },
        _count: { select: { absences: true, grades: true } },
        grades: {
          select: {
            value: true, trimester: true, coefficient: true,
            subject: { select: { name: true } }
          }
        }
      },
      orderBy: { lastName: 'asc' }
    });

    return students.map(student => {
      const grades = student.grades || [];
      return {
        ...student,
        averages: {
          trimestre1: this.calculateTrimesterAverage(grades, 1),
          trimestre2: this.calculateTrimesterAverage(grades, 2),
          trimestre3: this.calculateTrimesterAverage(grades, 3),
          annuelle:   this.calculateYearlyAverage(grades)
        }
      };
    });
  }
}