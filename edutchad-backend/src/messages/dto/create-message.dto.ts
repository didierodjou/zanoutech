// src/messages/dto/send-message.dto.ts
export class SendMessageDto {
  receiverId!: string;
  subject!: string;
  content!: string;
  isUrgent?: boolean;
}