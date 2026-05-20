// src/subjects/subjects.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubjectCategory } from '@prisma/client'; // ✅ import de l'enum

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    // ✅ findFirst au lieu de findUnique (@@unique([name, isDeleted]), pas @unique sur name seul)
    const existingSubject = await this.prisma.subject.findFirst({
      where: { name: data.name, isDeleted: false },
    });

    if (existingSubject) {
      throw new ConflictException('Une matière avec ce nom existe déjà');
    }

    const category: SubjectCategory = data.category || SubjectCategory.LITTERAIRE; // ✅ enum typé
    if (!Object.values(SubjectCategory).includes(category)) {
      throw new ConflictException('La catégorie doit être LITTERAIRE ou SCIENTIFIQUE');
    }

    const coefficient = data.coefficient || 1;
    if (coefficient < 1 || coefficient > 10) {
      throw new ConflictException('Le coefficient doit être compris entre 1 et 10');
    }

    return this.prisma.subject.create({
      data: {
        name: data.name,
        color: data.color || '#3498db',
        category,
        coefficient,
      },
    });
  }

  async findAll() {
    return this.prisma.subject.findMany({
      include: {
        teachers: {
          select: { id: true, firstName: true, lastName: true, specialty: true },
        },
        courses: {
          include: {
            class: { select: { id: true, name: true, level: true } },
          },
        },
        _count: { select: { teachers: true, courses: true } },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teachers: {
          select: { id: true, firstName: true, lastName: true, specialty: true },
        },
        courses: {
          include: {
            class: { select: { id: true, name: true, level: true } },
          },
        },
        _count: { select: { teachers: true, courses: true } },
      },
    });

    if (!subject) throw new NotFoundException(`Matière avec ID ${id} non trouvée`);
    return subject;
  }

  async getDetails(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teachers: {
          select: { id: true, firstName: true, lastName: true, specialty: true },
        },
        courses: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
            class: { select: { id: true, name: true, level: true } },
          },
        },
        _count: { select: { teachers: true, courses: true } },
      },
    });

    if (!subject) throw new NotFoundException(`Matière avec ID ${id} non trouvée`);
    return subject;
  }

  async update(id: string, data: any) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException(`Matière avec ID ${id} non trouvée`);

    if (data.name && data.name !== subject.name) {
      // ✅ findFirst au lieu de findUnique
      const existingSubject = await this.prisma.subject.findFirst({
        where: { name: data.name, isDeleted: false },
      });
      if (existingSubject) {
        throw new ConflictException('Une matière avec ce nom existe déjà');
      }
    }

    if (data.category && !Object.values(SubjectCategory).includes(data.category)) {
      throw new ConflictException('La catégorie doit être LITTERAIRE ou SCIENTIFIQUE');
    }

    if (data.coefficient && (data.coefficient < 1 || data.coefficient > 10)) {
      throw new ConflictException('Le coefficient doit être compris entre 1 et 10');
    }

    return this.prisma.subject.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
        category: data.category as SubjectCategory | undefined, // ✅ cast explicite
        coefficient: data.coefficient,
      },
      include: {
        teachers: true,
        courses: { include: { class: true } },
        _count: { select: { teachers: true, courses: true } },
      },
    });
  }

  async assignTeachers(id: string, teacherIds: string[]) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException(`Matière avec ID ${id} non trouvée`);

    const teachers = await this.prisma.teacher.findMany({
      where: { id: { in: teacherIds } },
    });

    if (teachers.length !== teacherIds.length) {
      throw new NotFoundException("Un ou plusieurs professeurs n'existent pas");
    }

    return this.prisma.subject.update({
      where: { id },
      data: {
        teachers: { set: teacherIds.map((tid) => ({ id: tid })) },
      },
      include: {
        teachers: {
          select: { id: true, firstName: true, lastName: true, specialty: true },
        },
        courses: { include: { class: true } },
        _count: { select: { teachers: true, courses: true } },
      },
    });
  }

  async delete(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        _count: { select: { courses: true, grades: true, controls: true } },
      },
    });

    if (!subject) throw new NotFoundException(`Matière avec ID ${id} non trouvée`);

    if (subject._count.courses > 0 || subject._count.grades > 0 || subject._count.controls > 0) {
      throw new ConflictException(
        'Impossible de supprimer une matière utilisée dans des cours, notes ou contrôles',
      );
    }

    return this.prisma.subject.delete({ where: { id } });
  }

  async search(query: string) {
    return this.prisma.subject.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      include: {
        teachers: { select: { id: true, firstName: true, lastName: true } },
        courses: { include: { class: true } },
        _count: { select: { teachers: true, courses: true } },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getCount() {
    return this.prisma.subject.count();
  }

  async findByCategory(category: string) {
    // ✅ Valider et caster en SubjectCategory
    if (!Object.values(SubjectCategory).includes(category as SubjectCategory)) {
      throw new ConflictException('La catégorie doit être LITTERAIRE ou SCIENTIFIQUE');
    }

    return this.prisma.subject.findMany({
      where: { category: category as SubjectCategory }, // ✅ cast
      include: {
        teachers: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { teachers: true, courses: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
}