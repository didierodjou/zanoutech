// src/subjects/subjects.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  // 1. Créer une matière avec catégorie et coefficient
  async create(data: any) {
    // Vérifier si le nom existe déjà
    const existingSubject = await this.prisma.subject.findUnique({
      where: { name: data.name }
    });

    if (existingSubject) {
      throw new ConflictException('Une matière avec ce nom existe déjà');
    }

    // Valider la catégorie
    const category = data.category || 'LITTERAIRE';
    if (!['LITTERAIRE', 'SCIENTIFIQUE'].includes(category)) {
      throw new ConflictException('La catégorie doit être LITTERAIRE ou SCIENTIFIQUE');
    }

    // Valider le coefficient (entre 1 et 10)
    const coefficient = data.coefficient || 1;
    if (coefficient < 1 || coefficient > 10) {
      throw new ConflictException('Le coefficient doit être compris entre 1 et 10');
    }

    return this.prisma.subject.create({
      data: {
        name: data.name,
        color: data.color || '#3498db',
        category: category,
        coefficient: coefficient
      }
    });
  }

  // 2. Lister toutes les matières avec leurs relations
  async findAll() {
    return this.prisma.subject.findMany({
      include: {
        teachers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
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
            }
          }
        },
        _count: {
          select: {
            teachers: true,
            courses: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  // 3. Trouver une matière par ID
  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teachers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
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
            }
          }
        },
        _count: {
          select: {
            teachers: true,
            courses: true
          }
        }
      }
    });

    if (!subject) {
      throw new NotFoundException(`Matière avec ID ${id} non trouvée`);
    }

    return subject;
  }

  // 4. Détails complets d'une matière
  async getDetails(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teachers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        courses: {
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
          }
        },
        _count: {
          select: {
            teachers: true,
            courses: true
          }
        }
      }
    });

    if (!subject) {
      throw new NotFoundException(`Matière avec ID ${id} non trouvée`);
    }

    return subject;
  }

  // 5. Mettre à jour une matière
  async update(id: string, data: any) {
    const subject = await this.prisma.subject.findUnique({
      where: { id }
    });

    if (!subject) {
      throw new NotFoundException(`Matière avec ID ${id} non trouvée`);
    }

    // Vérifier si le nouveau nom n'est pas déjà pris
    if (data.name && data.name !== subject.name) {
      const existingSubject = await this.prisma.subject.findUnique({
        where: { name: data.name }
      });

      if (existingSubject) {
        throw new ConflictException('Une matière avec ce nom existe déjà');
      }
    }

    // Valider la catégorie si fournie
    if (data.category && !['LITTERAIRE', 'SCIENTIFIQUE'].includes(data.category)) {
      throw new ConflictException('La catégorie doit être LITTERAIRE ou SCIENTIFIQUE');
    }

    // Valider le coefficient si fourni
    if (data.coefficient && (data.coefficient < 1 || data.coefficient > 10)) {
      throw new ConflictException('Le coefficient doit être compris entre 1 et 10');
    }

    return this.prisma.subject.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
        category: data.category,
        coefficient: data.coefficient
      },
      include: {
        teachers: true,
        courses: {
          include: {
            class: true
          }
        },
        _count: {
          select: {
            teachers: true,
            courses: true
          }
        }
      }
    });
  }

  // 6. Assigner des professeurs à une matière
  async assignTeachers(id: string, teacherIds: string[]) {
    const subject = await this.prisma.subject.findUnique({
      where: { id }
    });

    if (!subject) {
      throw new NotFoundException(`Matière avec ID ${id} non trouvée`);
    }

    // Vérifier que tous les professeurs existent
    const teachers = await this.prisma.teacher.findMany({
      where: {
        id: { in: teacherIds }
      }
    });

    if (teachers.length !== teacherIds.length) {
      throw new NotFoundException('Un ou plusieurs professeurs n\'existent pas');
    }

    // Mettre à jour les relations
    return this.prisma.subject.update({
      where: { id },
      data: {
        teachers: {
          set: teacherIds.map(id => ({ id }))
        }
      },
      include: {
        teachers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        courses: {
          include: {
            class: true
          }
        },
        _count: {
          select: {
            teachers: true,
            courses: true
          }
        }
      }
    });
  }

  // 7. Supprimer une matière
  async delete(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courses: true,
            grades: true,
            controls: true
          }
        }
      }
    });

    if (!subject) {
      throw new NotFoundException(`Matière avec ID ${id} non trouvée`);
    }

    // Vérifier si la matière est utilisée
    if (subject._count.courses > 0 || subject._count.grades > 0 || subject._count.controls > 0) {
      throw new ConflictException('Impossible de supprimer une matière qui est utilisée dans des cours, notes ou contrôles');
    }

    return this.prisma.subject.delete({
      where: { id }
    });
  }

  // 8. Rechercher des matières
  async search(query: string) {
    return this.prisma.subject.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include: {
        teachers: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        courses: {
          include: {
            class: true
          }
        },
        _count: {
          select: {
            teachers: true,
            courses: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  // 9. Obtenir le nombre total de matières
  async getCount() {
    return this.prisma.subject.count();
  }

  // 10. Obtenir les matières par catégorie
  async findByCategory(category: string) {
    if (!['LITTERAIRE', 'SCIENTIFIQUE'].includes(category)) {
      throw new ConflictException('La catégorie doit être LITTERAIRE ou SCIENTIFIQUE');
    }

    return this.prisma.subject.findMany({
      where: { category },
      include: {
        teachers: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            teachers: true,
            courses: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }
}