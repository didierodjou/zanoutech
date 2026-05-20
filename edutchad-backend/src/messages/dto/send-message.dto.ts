export class SendMessageDto {
  receiverId!: string;
  subject!: string;
  content!: string;
  isUrgent?: boolean;
}