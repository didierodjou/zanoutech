// src/teachers/teachers.module.ts
import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailModule } from '../email/email.module'; // Vérifiez que le chemin est correct

@Module({
  imports: [EmailModule], // EmailModule doit être importé ici
  controllers: [TeachersController],
  providers: [TeachersService, PrismaService],
  exports: [TeachersService]
})
export class TeachersModule {}