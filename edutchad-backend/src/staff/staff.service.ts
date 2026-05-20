// src/staff/staff.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const hashedPassword = await bcrypt.hash('staff123', 10);

    // ✅ findFirst au lieu de findUnique (@@unique([email, isDeleted]))
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email, isDeleted: false },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          role: Role.STAFF,
        },
      });

      return tx.staff.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          jobTitle: data.jobTitle,
          department: data.department,
          hiringDate: new Date(data.hiringDate),
          phone: data.phone || null,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.staff.findMany({
      include: {
        user: { select: { email: true, isActive: true, createdAt: true } },
        _count: { select: { salaries: true } },
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, isActive: true, createdAt: true } },
        _count: { select: { salaries: true } },
      },
    });

    if (!staff) throw new NotFoundException(`Membre du personnel avec ID ${id} non trouvé`);
    return staff;
  }

  async getDetails(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, createdAt: true, isActive: true } },
        salaries: { orderBy: { month: 'desc' }, take: 12 },
      },
    });

    if (!staff) throw new NotFoundException(`Membre du personnel avec ID ${id} non trouvé`);

    const today = new Date();
    const hiringDate = new Date(staff.hiringDate);
    const totalMonths = Math.floor(
      (today.getTime() - hiringDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );
    const years = Math.floor(totalMonths / 12);

    return {
      ...staff,
      seniority: { years, months: totalMonths % 12, totalMonths },
    };
  }

  async update(id: string, data: any) {
    const staff = await this.prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException(`Membre du personnel avec ID ${id} non trouvé`);

    return this.prisma.staff.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        jobTitle: data.jobTitle,
        department: data.department,
        hiringDate: data.hiringDate ? new Date(data.hiringDate) : undefined,
        phone: data.phone,
      },
      include: { user: { select: { email: true } } },
    });
  }

  async delete(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: { _count: { select: { salaries: true } } },
    });

    if (!staff) throw new NotFoundException(`Membre du personnel avec ID ${id} non trouvé`);

    if (staff._count.salaries > 0) {
      throw new ConflictException(
        'Impossible de supprimer un membre qui a des salaires enregistrés',
      );
    }

    return this.prisma.staff.delete({ where: { id } });
  }

  async search(query: string) {
    return this.prisma.staff.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { jobTitle: { contains: query, mode: 'insensitive' } },
          { department: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { user: { select: { email: true } } },
      orderBy: { lastName: 'asc' },
    });
  }

  async getDepartmentStats() {
    const staff = await this.prisma.staff.findMany({ include: { salaries: true } });

    const stats: Record<string, any> = {};

    staff.forEach((member) => {
      if (!stats[member.department]) {
        stats[member.department] = { count: 0, averageSalary: 0, totalSalary: 0, members: [] };
      }
      stats[member.department].count++;
      if (member.salaries.length > 0) {
        const avg =
          member.salaries.reduce((acc, s) => acc + s.netAmount, 0) / member.salaries.length;
        stats[member.department].totalSalary += avg;
      }
      stats[member.department].members.push({
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        jobTitle: member.jobTitle,
      });
    });

    Object.keys(stats).forEach((dept) => {
      if (stats[dept].count > 0) {
        stats[dept].averageSalary = stats[dept].totalSalary / stats[dept].count;
      }
    });

    return stats;
  }

  async findByDepartment(department: string) {
    return this.prisma.staff.findMany({
      where: { department },
      include: { user: { select: { email: true } } },
      orderBy: { lastName: 'asc' },
    });
  }

  async getSeniorityStats() {
    const staff = await this.prisma.staff.findMany();
    const today = new Date();

    const stats = {
      lessThan1Year: 0,
      between1And3Years: 0,
      between3And5Years: 0,
      between5And10Years: 0,
      moreThan10Years: 0,
      averageSeniority: 0,
    };

    let totalYears = 0;

    staff.forEach((member) => {
      const years =
        (today.getTime() - new Date(member.hiringDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      totalYears += years;
      if (years < 1) stats.lessThan1Year++;
      else if (years < 3) stats.between1And3Years++;
      else if (years < 5) stats.between3And5Years++;
      else if (years < 10) stats.between5And10Years++;
      else stats.moreThan10Years++;
    });

    stats.averageSeniority =
      staff.length > 0 ? Number((totalYears / staff.length).toFixed(1)) : 0;

    return stats;
  }
}