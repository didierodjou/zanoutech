// src/courses/courses.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // 1. Créer un cours
  async create(data: any) {
    // Vérifier si le professeur existe
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: data.teacherId }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${data.teacherId} non trouvé`);
    }

    // Vérifier si la matière existe
    const subject = await this.prisma.subject.findUnique({
      where: { id: data.subjectId }
    });

    if (!subject) {
      throw new NotFoundException(`Matière avec ID ${data.subjectId} non trouvée`);
    }

    // Vérifier si la classe existe
    const classe = await this.prisma.class.findUnique({
      where: { id: data.classId }
    });

    if (!classe) {
      throw new NotFoundException(`Classe avec ID ${data.classId} non trouvée`);
    }

    // Vérifier si un cours similaire existe déjà
    const existingCourse = await this.prisma.course.findFirst({
      where: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        classId: data.classId
      }
    });

    if (existingCourse) {
      throw new ConflictException('Ce cours existe déjà pour ce professeur, cette matière et cette classe');
    }

    // Créer le cours
    return this.prisma.course.create({
      data: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        classId: data.classId,
        coefficient: data.coefficient || 1
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
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
    });
  }

  // 2. Lister tous les cours
  async findAll() {
    return this.prisma.course.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
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
        },
        _count: {
          select: {
            scheduleSlots: true
            // grades n'existe pas dans Course
          }
        }
      },
      orderBy: [
        { class: { name: 'asc' } },
        { subject: { name: 'asc' } }
      ]
    });
  }

  // 3. Trouver un cours par ID
  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
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
            level: true,
            _count: {
              select: { students: true }
            }
          }
        },
        scheduleSlots: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
        // grades n'existe pas dans Course
      }
    });

    if (!course) {
      throw new NotFoundException(`Cours avec ID ${id} non trouvé`);
    }

    return course;
  }

  // 4. Cours par professeur
  async findByTeacher(teacherId: string) {
    return this.prisma.course.findMany({
      where: { teacherId },
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
        },
        _count: {
          select: {
            scheduleSlots: true
          }
        }
      },
      orderBy: [
        { class: { name: 'asc' } },
        { subject: { name: 'asc' } }
      ]
    });
  }

  // 5. Cours par classe
  async findByClass(classId: string) {
    return this.prisma.course.findMany({
      where: { classId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: [
        { subject: { name: 'asc' } }
      ]
    });
  }

  // 6. Cours par matière
  async findBySubject(subjectId: string) {
    return this.prisma.course.findMany({
      where: { subjectId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            level: true
          }
        }
      },
      orderBy: [
        { class: { name: 'asc' } }
      ]
    });
  }

  // 7. Mettre à jour un cours
  async update(id: string, data: any) {
    const course = await this.prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      throw new NotFoundException(`Cours avec ID ${id} non trouvé`);
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        classId: data.classId,
        coefficient: data.coefficient
      },
      include: {
        teacher: true,
        subject: true,
        class: true
      }
    });
  }

  // 8. Supprimer un cours
  async delete(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            scheduleSlots: true
          }
        }
      }
    });

    if (!course) {
      throw new NotFoundException(`Cours avec ID ${id} non trouvé`);
    }

    // Vérifier s'il y a des créneaux dans l'emploi du temps
    if (course._count.scheduleSlots > 0) {
      throw new ConflictException('Impossible de supprimer un cours qui a des créneaux dans l\'emploi du temps');
    }

    return this.prisma.course.delete({
      where: { id }
    });
  }

  // 9. Rechercher des cours
  async search(query: string) {
    return this.prisma.course.findMany({
      where: {
        OR: [
          { teacher: { firstName: { contains: query, mode: 'insensitive' } } },
          { teacher: { lastName: { contains: query, mode: 'insensitive' } } },
          { subject: { name: { contains: query, mode: 'insensitive' } } },
          { class: { name: { contains: query, mode: 'insensitive' } } }
        ]
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
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
        },
        _count: {
          select: {
            scheduleSlots: true
          }
        }
      }
    });
  }

  // 10. Obtenir les statistiques des cours
  async getStats() {
    const courses = await this.prisma.course.findMany({
      include: {
        _count: {
          select: {
            scheduleSlots: true
          }
        }
      }
    });

    return {
      total: courses.length,
      byTeacher: courses.reduce((acc, c) => {
        acc[c.teacherId] = (acc[c.teacherId] || 0) + 1;
        return acc;
      }, {}),
      bySubject: courses.reduce((acc, c) => {
        acc[c.subjectId] = (acc[c.subjectId] || 0) + 1;
        return acc;
      }, {}),
      byClass: courses.reduce((acc, c) => {
        acc[c.classId] = (acc[c.classId] || 0) + 1;
        return acc;
      }, {}),
      withSchedule: courses.filter(c => c._count.scheduleSlots > 0).length
    };
  }
}