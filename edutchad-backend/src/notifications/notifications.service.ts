import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationItem {
  id: string;
  type: 'message' | 'meeting';
  title: string;
  description: string;
  date: Date;
  read: boolean;
  link: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Un User avec role TEACHER a toujours un Teacher lié, mais on reste défensif
  private async getTeacherId(userId: string): Promise<string | null> {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    return teacher?.id ?? null;
  }

  async getCount(userId: string): Promise<number> {
    const [unreadMessages, upcomingMeetings] = await Promise.all([
      this.prisma.message.count({ where: { receiverId: userId, read: false } }),
      this.getUpcomingMeetingsCount(userId),
    ]);
    return unreadMessages + upcomingMeetings;
  }

  private async getUpcomingMeetingsCount(userId: string): Promise<number> {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const teacherId = await this.getTeacherId(userId);

    return this.prisma.meeting.count({
      where: {
        date: { gte: now, lte: in48h },
        OR: [
          { participants: { some: { userId } } },
          ...(teacherId ? [{ organizerId: teacherId }] : []),
        ],
      },
    });
  }

  async list(userId: string): Promise<NotificationItem[]> {
    const teacherId = await this.getTeacherId(userId);
    const now = new Date();
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [messages, meetings] = await Promise.all([
      this.prisma.message.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          sender: {
            select: {
              email: true,
              teacherProfile: { select: { firstName: true, lastName: true } },
              staffProfile: { select: { firstName: true, lastName: true } },
              studentProfile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.meeting.findMany({
        where: {
          date: { gte: now, lte: in7d },
          OR: [
            { participants: { some: { userId } } },
            ...(teacherId ? [{ organizerId: teacherId }] : []),
          ],
        },
        orderBy: { date: 'asc' },
        take: 30,
      }),
    ]);

    const messageItems: NotificationItem[] = messages.map((m) => {
      const senderName =
        (m.sender.teacherProfile &&
          `${m.sender.teacherProfile.firstName} ${m.sender.teacherProfile.lastName}`) ||
        (m.sender.staffProfile &&
          `${m.sender.staffProfile.firstName} ${m.sender.staffProfile.lastName}`) ||
        (m.sender.studentProfile &&
          `${m.sender.studentProfile.firstName} ${m.sender.studentProfile.lastName}`) ||
        m.sender.email;

      return {
        id: `message-${m.id}`,
        type: 'message',
        title: m.isUrgent ? `[Urgent] ${m.subject}` : m.subject,
        description: `De ${senderName}`,
        date: m.createdAt,
        read: m.read,
        link: `/teacher/messages?open=${m.id}`,
      };
    });

    const meetingItems: NotificationItem[] = meetings.map((mt) => ({
      id: `meeting-${mt.id}`,
      type: 'meeting',
      title: mt.title,
      description: `${mt.type} · ${mt.location}`,
      date: mt.date,
      read: true,
      link: `/teacher/meetings?open=${mt.id}`,
    }));

    return [...messageItems, ...meetingItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }
}