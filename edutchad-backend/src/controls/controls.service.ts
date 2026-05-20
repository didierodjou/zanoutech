// src/controls/controls.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ControlsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const student = await this.prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) throw new NotFoundException(`Élève avec ID ${data.studentId} non trouvé`);

    const subject = await this.prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject) throw new NotFoundException(`Matière avec ID ${data.subjectId} non trouvée`);

    const existingControl = await this.prisma.control.findFirst({
      where: {
        studentId: data.studentId,
        subjectId: data.subjectId,
        trimester: data.trimester,
        type: data.type,
      },
    });

    const includeClause = {
      student: { select: { id: true, firstName: true, lastName: true } },
      subject: { select: { id: true, name: true, color: true } },
    };

    if (existingControl) {
      return this.prisma.control.update({
        where: { id: existingControl.id },
        data: { value: data.value, date: new Date() },
        include: includeClause,
      });
    }

    // ✅ title est obligatoire dans le schéma (Control.title String)
    const title = data.title || `${data.type} T${data.trimester}`;

    return this.prisma.control.create({
      data: {
        title,                        // ✅ champ obligatoire
        type: data.type,
        value: data.value ?? null,    // ✅ Float? — nullable
        trimester: data.trimester,
        studentId: data.studentId,
        subjectId: data.subjectId,
      },
      include: includeClause,
    });
  }

  async findAll() {
    return this.prisma.control.findMany({
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, registrationNo: true },
        },
        subject: { select: { id: true, name: true, color: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const control = await this.prisma.control.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNo: true,
            class: true,
          },
        },
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    if (!control) throw new NotFoundException(`Contrôle avec ID ${id} non trouvé`);
    return control;
  }

  async findByStudent(studentId: string) {
    return this.prisma.control.findMany({
      where: { studentId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ trimester: 'asc' }, { date: 'desc' }],
    });
  }

  async findBySubject(subjectId: string) {
    return this.prisma.control.findMany({
      where: { subjectId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, registrationNo: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getStats(studentId: string, trimester: number) {
    const controls = await this.prisma.control.findMany({
      where: { studentId, trimester },
    });

    const devoir = controls.find((c) => c.type === 'DEVOIR');
    const interrogations = controls.filter((c) => c.type === 'INTERROGATION');

    let average = 0;

    if (devoir && interrogations.length > 0) {
      // ✅ Control.value est Float? (nullable) — utiliser ?? 0
      const interroAvg =
        interrogations.reduce((acc, curr) => acc + (curr.value ?? 0), 0) / interrogations.length;
      average = ((devoir.value ?? 0) + interroAvg) / 2;
    } else if (devoir) {
      average = devoir.value ?? 0; // ✅
    } else if (interrogations.length > 0) {
      average =
        interrogations.reduce((acc, curr) => acc + (curr.value ?? 0), 0) / interrogations.length; // ✅
    }

    return {
      trimester,
      devoir: devoir?.value ?? null,
      interrogations: interrogations.map((i) => i.value ?? null),
      average: Number(average.toFixed(2)),
      count: controls.length,
    };
  }
}