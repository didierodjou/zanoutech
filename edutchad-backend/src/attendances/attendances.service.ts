// src/attendances/attendances.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAbsenceDto} from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto'
import { UpdateAbsenceDto } from 'src/absences/dto/update-absence.dto';

@Injectable()
export class AttendancesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { studentId?: string; startDate?: Date; endDate?: Date; justified?: boolean }) {
    const where: any = {};
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }
    if (filters.justified !== undefined) where.isJustified = filters.justified;

    return this.prisma.absence.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true, registrationNo: true } },
        course: { include: { subject: true, teacher: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async create(dto: CreateAbsenceDto) {
    return this.prisma.absence.create({
      data: {
        ...dto,
        date: new Date(dto.date),
      } as any,
    });
  }

  async update(id: string, dto: UpdateAbsenceDto) {
    return this.prisma.absence.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.absence.delete({ where: { id } });
  }
}