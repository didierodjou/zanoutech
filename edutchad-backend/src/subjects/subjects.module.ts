// src/subjects/subjects.module.ts
import { Module } from '@nestjs/common';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SubjectsController],
  providers: [SubjectsService, PrismaService],
  exports: [SubjectsService]
})
export class SubjectsModule {}