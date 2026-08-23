import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getReceived(userId: string) {
    return this.prisma.message.findMany({
      where: { receiverId: userId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: { select: { firstName: true, lastName: true } },
            teacherProfile: { select: { firstName: true, lastName: true } },
            staffProfile: { select: { firstName: true, lastName: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: { select: { firstName: true, lastName: true } },
            teacherProfile: { select: { firstName: true, lastName: true } },
            staffProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSent(userId: string) {
    return this.prisma.message.findMany({
      where: { senderId: userId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: { select: { firstName: true, lastName: true } },
            teacherProfile: { select: { firstName: true, lastName: true } },
            staffProfile: { select: { firstName: true, lastName: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: { select: { firstName: true, lastName: true } },
            teacherProfile: { select: { firstName: true, lastName: true } },
            staffProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async send(dto: SendMessageDto, senderId: string) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('Destinataire non trouvé');
    }
    return this.prisma.message.create({
      data: {
        subject: dto.subject,
        content: dto.content,
        isUrgent: dto.isUrgent || false,
        senderId,
        receiverId: dto.receiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: { select: { firstName: true, lastName: true } },
            teacherProfile: { select: { firstName: true, lastName: true } },
            staffProfile: { select: { firstName: true, lastName: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: { select: { firstName: true, lastName: true } },
            teacherProfile: { select: { firstName: true, lastName: true } },
            staffProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, receiverId: userId },
    });
    if (!message) {
      throw new NotFoundException('Message non trouvé ou vous n\'êtes pas le destinataire');
    }
    return this.prisma.message.update({
      where: { id: messageId },
      data: { read: true },
    });
  }

  async delete(messageId: string, userId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, OR: [{ senderId: userId }, { receiverId: userId }] },
    });
    if (!message) {
      throw new NotFoundException('Message non trouvé ou vous n\'y avez pas accès');
    }
    return this.prisma.message.delete({ where: { id: messageId } });
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        studentProfile: { select: { firstName: true, lastName: true } },
        teacherProfile: { select: { firstName: true, lastName: true } },
        staffProfile: { select: { firstName: true, lastName: true } },
      },
      where: { isDeleted: false },
      orderBy: { email: 'asc' },
    });
  }
}