import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
  imports: [AuthModule, PrismaModule],
})
export class MessagesModule {}
