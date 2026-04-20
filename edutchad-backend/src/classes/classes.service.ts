import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  // 1. Créer une classe
  async create(data: any) {
    return this.prisma.class.create({
      data: {
        name: data.name,
        level: data.level,
      }
    });
  }

  // 2. Lister toutes les classes
  async findAll() {
    return this.prisma.class.findMany({
      include: {
        mainTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        _count: {
          select: { students: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  // 3. Trouver une classe par ID
  async findOne(id: string) {
    const classe = await this.prisma.class.findUnique({
      where: { id },
      include: {
        mainTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        _count: {
          select: { students: true }
        }
      }
    });

    if (!classe) {
      throw new NotFoundException(`Classe avec ID ${id} non trouvée`);
    }

    return classe;
  }

  // 4. Détails complets d'une classe (avec élèves)
  async getClassDetails(id: string) {
    const classe = await this.prisma.class.findUnique({
      where: { id },
      include: {
        mainTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNo: true,
          },
          orderBy: { lastName: 'asc' }
        },
        courses: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
              }
            },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    });

    if (!classe) {
      throw new NotFoundException(`Classe avec ID ${id} non trouvée`);
    }

    return {
      ...classe,
      studentCount: classe.students.length,
    };
  }

  // 5. Mettre à jour une classe
  async update(id: string, data: any) {
    const classe = await this.prisma.class.findUnique({
      where: { id }
    });

    if (!classe) {
      throw new NotFoundException(`Classe avec ID ${id} non trouvée`);
    }

    return this.prisma.class.update({
      where: { id },
      data: {
        name: data.name,
        level: data.level,
      },
      include: {
        mainTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });
  }

  // 6. Assigner un professeur principal
  async assignMainTeacher(classId: string, teacherId: string) {
    // Vérifier si la classe existe
    const classe = await this.prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classe) {
      throw new NotFoundException(`Classe avec ID ${classId} non trouvée`);
    }

    // Vérifier si le professeur existe
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) {
      throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);
    }

    // Retirer le statut de professeur principal de l'ancien titulaire
    await this.prisma.teacher.updateMany({
      where: { 
        mainClassId: classId
      },
      data: { 
        mainClassId: null
      }
    });

    // Assigner le nouveau professeur principal
    return this.prisma.class.update({
      where: { id: classId },
      data: {
        mainTeacher: {
          connect: { id: teacherId }
        }
      },
      include: { 
        mainTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });
  }

  // 7. Supprimer une classe
   async delete(id: string) {
    // Vérifier si la classe existe
    const classe = await this.prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            students: true,
            courses: true 
          }
        }
      }
    });

    if (!classe) {
      throw new NotFoundException(`Classe avec ID ${id} non trouvée`);
    }

    // RÈGLE 1 : Vérifier s'il y a des élèves
    if (classe._count.students > 0) {
      // On lance une BadRequestException (Code 400) avec un message clair
      throw new BadRequestException(
        `Impossible de supprimer la classe "${classe.name}". Elle contient encore ${classe._count.students} élève(s). Veuillez d'abord supprimer ou déplacer ces élèves.`
      );
    }

    // RÈGLE 2 : Vérifier s'il y a des cours programmés
    if (classe._count.courses > 0) {
      throw new BadRequestException(
        `Impossible de supprimer la classe "${classe.name}". Des cours y sont associés. Veuillez d'abord supprimer les cours.`
      );
    }

    // D'abord, retirer le statut de prof principal si nécessaire
    await this.prisma.teacher.updateMany({
      where: { mainClassId: id },
      data: { mainClassId: null }
    });

    // Enfin, supprimer la classe
    return this.prisma.class.delete({
      where: { id }
    });
  }

}