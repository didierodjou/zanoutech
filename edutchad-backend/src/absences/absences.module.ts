// src/absences/absences.module.ts
import { Module } from '@nestjs/common';
import { AbsencesController } from './absences.controller';
import { AbsencesService } from './absences.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AbsencesController],
  providers: [AbsencesService, PrismaService],
  exports: [AbsencesService]
})
export class AbsencesModule {}