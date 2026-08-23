import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

const PARTICIPANT_SELECT = {
  id: true,
  email: true,
  role: true,
  studentProfile: { select: { firstName: true, lastName: true } },
  teacherProfile: { select: { firstName: true, lastName: true } },
  staffProfile: { select: { firstName: true, lastName: true } },
} as const;

@Injectable()
export class MeetingService {
  constructor(private prisma: PrismaService) {}

  async create(createMeetingDto: CreateMeetingDto) {
    const { participantUserIds, ...meetingData } = createMeetingDto;

    // Vérifier que l'organisateur (teacher) existe
    const organizer = await this.prisma.teacher.findUnique({
      where: { id: meetingData.organizerId },
    });
    if (!organizer) {
      throw new NotFoundException(`Enseignant organisateur avec ID ${meetingData.organizerId} non trouvé`);
    }

    // Créer la réunion et ses participants dans une transaction
    return this.prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          title: meetingData.title,
          type: meetingData.type,
          date: meetingData.date,
          duration: meetingData.duration,
          location: meetingData.location,
          agenda: meetingData.agenda,
          organizerId: meetingData.organizerId,
        },
        include: {
          organizer: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      if (participantUserIds && participantUserIds.length > 0) {
        await tx.meetingParticipant.createMany({
          data: participantUserIds.map((userId) => ({
            meetingId: meeting.id,
            userId: userId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.meeting.findUnique({
        where: { id: meeting.id },
        include: {
          organizer: { select: { firstName: true, lastName: true } },
          participants: {
            include: { user: { select: PARTICIPANT_SELECT } },
          },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.meeting.findMany({
      include: {
        organizer: { select: { firstName: true, lastName: true } },
        participants: {
          include: { user: { select: PARTICIPANT_SELECT } },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findByStudentId(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    if (!student) throw new NotFoundException(`Étudiant avec ID ${studentId} non trouvé`);
    return this.findByUserId(student.userId);
  }

  async findByUserId(userId: string) {
    const participations = await this.prisma.meetingParticipant.findMany({
      where: { userId },
      include: {
        meeting: {
          include: {
            organizer: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { meeting: { date: 'asc' } },
    });
    return participations.map((p) => ({
      id: p.meeting.id,
      title: p.meeting.title,
      type: p.meeting.type,
      date: p.meeting.date,
      duration: p.meeting.duration,
      location: p.meeting.location,
      agenda: p.meeting.agenda,
      organizer: p.meeting.organizer,
    }));
  }

  // Réunions organisées par le prof + celles où il est simple participant
  async findByTeacherId(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { userId: true },
    });
    if (!teacher) throw new NotFoundException(`Enseignant avec ID ${teacherId} non trouvé`);

    const meetings = await this.prisma.meeting.findMany({
      where: {
        OR: [{ organizerId: teacherId }, { participants: { some: { userId: teacher.userId } } }],
      },
      include: {
        organizer: { select: { firstName: true, lastName: true } },
        participants: {
          include: { user: { select: PARTICIPANT_SELECT } },
        },
      },
      orderBy: { date: 'asc' },
    });

    return meetings.map((m) => ({ ...m, isOrganizer: m.organizerId === teacherId }));
  }

  async findOne(id: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        organizer: { select: { firstName: true, lastName: true } },
        participants: {
          include: { user: { select: PARTICIPANT_SELECT } },
        },
      },
    });
    if (!meeting) throw new NotFoundException(`Réunion avec ID ${id} non trouvée`);
    return meeting;
  }

  async update(id: string, updateMeetingDto: UpdateMeetingDto) {
    const existing = await this.prisma.meeting.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Réunion avec ID ${id} non trouvée`);

    const { participantUserIds, ...updateData } = updateMeetingDto;

    return this.prisma.$transaction(async (tx) => {
      // Mise à jour des champs de base
      await tx.meeting.update({
        where: { id },
        data: {
          title: updateData.title,
          type: updateData.type,
          date: updateData.date,
          duration: updateData.duration,
          location: updateData.location,
          agenda: updateData.agenda,
          organizerId: updateData.organizerId,
        },
        include: {
          organizer: { select: { firstName: true, lastName: true } },
        },
      });

      if (participantUserIds) {
        await tx.meetingParticipant.deleteMany({ where: { meetingId: id } });
        if (participantUserIds.length > 0) {
          await tx.meetingParticipant.createMany({
            data: participantUserIds.map((userId) => ({
              meetingId: id,
              userId,
            })),
          });
        }
      }

      return this.findOne(id);
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.meeting.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Réunion avec ID ${id} non trouvée`);
    return this.prisma.meeting.delete({ where: { id } });
  }

  async addParticipant(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException(`Réunion ${meetingId} non trouvée`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`Utilisateur ${userId} non trouvé`);
    return this.prisma.meetingParticipant.create({
      data: { meetingId, userId },
    });
  }

  async removeParticipant(meetingId: string, userId: string) {
    return this.prisma.meetingParticipant.delete({
      where: { meetingId_userId: { meetingId, userId } },
    });
  }
}