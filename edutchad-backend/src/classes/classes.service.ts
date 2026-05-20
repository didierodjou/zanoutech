import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; level: string; schoolYearId: string }) {
    return this.prisma.class.create({
      data: {
        name: data.name,
        level: data.level,
        schoolYearId: data.schoolYearId,
      },
      include: { schoolYear: true, mainTeacher: true },
    });
  }

  async findAll() {
    return this.prisma.class.findMany({
      include: {
        mainTeacher: { select: { id: true, firstName: true, lastName: true } },
        schoolYear: true, // <-- ajout
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const classe = await this.prisma.class.findUnique({
      where: { id },
      include: {
        mainTeacher: { select: { id: true, firstName: true, lastName: true } },
        schoolYear: true,
        _count: { select: { students: true } },
      },
    });
    if (!classe) throw new NotFoundException(`Classe avec ID ${id} non trouvée`);
    return classe;
  }

  async getClassDetails(id: string) {
    const classe = await this.prisma.class.findUnique({
      where: { id },
      include: {
        mainTeacher: { select: { id: true, firstName: true, lastName: true } },
        schoolYear: true,
        students: {
          select: { id: true, firstName: true, lastName: true, registrationNo: true },
          orderBy: { lastName: 'asc' },
        },
        courses: {
          include: {
            subject: { select: { id: true, name: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!classe) throw new NotFoundException(`Classe avec ID ${id} non trouvée`);
    return { ...classe, studentCount: classe.students.length };
  }

  async update(id: string, data: { name: string; level: string; schoolYearId: string }) {
    const classe = await this.prisma.class.findUnique({ where: { id } });
    if (!classe) throw new NotFoundException(`Classe avec ID ${id} non trouvée`);
    return this.prisma.class.update({
      where: { id },
      data: {
        name: data.name,
        level: data.level,
        schoolYearId: data.schoolYearId,
      },
      include: { mainTeacher: true, schoolYear: true },
    });
  }

  async assignMainTeacher(classId: string, teacherId: string) {
    const classe = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!classe) throw new NotFoundException(`Classe avec ID ${classId} non trouvée`);

    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException(`Professeur avec ID ${teacherId} non trouvé`);

    // ✅ updateMany n'accepte pas les relations dans `data`.
    // La relation mainTeacher/mainClass est 1-1 côté Class.
    // On déconnecte via class.update si un prof est déjà assigné,
    // puis on connecte le nouveau — tout en une seule opération.
    return this.prisma.class.update({
      where: { id: classId },
      data: {
        // connect remplace automatiquement l'existant sur une relation 1-1
        mainTeacher: { connect: { id: teacherId } },
      },
      include: {
        mainTeacher: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async delete(id: string) {
    const classe = await this.prisma.class.findUnique({
      where: { id },
      include: {
        _count: { select: { students: true, courses: true } },
      },
    });

    if (!classe) throw new NotFoundException(`Classe avec ID ${id} non trouvée`);

    if (classe._count.students > 0) {
      throw new BadRequestException(
        `Impossible de supprimer la classe "${classe.name}". Elle contient encore ${classe._count.students} élève(s).`,
      );
    }

    if (classe._count.courses > 0) {
      throw new BadRequestException(
        `Impossible de supprimer la classe "${classe.name}". Des cours y sont associés.`,
      );
    }

    // ✅ Retirer le prof principal via la classe (pas via teacher.updateMany)
    // La suppression de la classe via cascade Prisma déconnecte automatiquement
    // la relation 1-1, mais on le fait explicitement pour être propre.
    if (classe.mainTeacherId) {
      await this.prisma.class.update({
        where: { id },
        data: { mainTeacher: { disconnect: true } },
      });
    }

    return this.prisma.class.delete({ where: { id } });
  }

  async addCourse(
    classId: string,
    data: { subjectId: string; teacherId: string; coefficient: number },
  ) {
    const classe = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!classe) throw new NotFoundException(`Classe ${classId} non trouvée`);

    const existing = await this.prisma.course.findFirst({
      where: { classId, subjectId: data.subjectId },
    });
    if (existing) throw new BadRequestException('Cette matière est déjà assignée à cette classe');

    return this.prisma.course.create({
      data: {
        classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        coefficient: data.coefficient,
      },
      include: { subject: true, teacher: true },
    });
  }

  async updateCourse(
    courseId: string,
    data: { subjectId?: string; teacherId?: string; coefficient?: number },
  ) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Cours ${courseId} non trouvé`);

    return this.prisma.course.update({
      where: { id: courseId },
      data,
      include: { subject: true, teacher: true },
    });
  }

  async deleteCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Cours ${courseId} non trouvé`);
    return this.prisma.course.delete({ where: { id: courseId } });
  }
}