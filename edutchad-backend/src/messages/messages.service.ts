// src/messages/messages.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getReceived(userId: string) {
    return this.prisma.message.findMany({
      where: { receiverId: userId },
      include: { sender: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSent(userId: string) {
    return this.prisma.message.findMany({
      where: { senderId: userId },
      include: { receiver: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async send(dto: SendMessageDto, senderId: string) {
    return this.prisma.message.create({
      data: {
        ...dto,
        senderId,
        isUrgent: dto.isUrgent || false,
      },
    });
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, receiverId: userId },
    });
    if (!message) throw new NotFoundException('Message non trouvé');
    return this.prisma.message.update({
      where: { id: messageId },
      data: { read: true },
    });
  }
}