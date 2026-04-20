// src/salaries/salaries.module.ts
import { Module } from '@nestjs/common';
import { SalariesController } from './salaries.controller';
import { SalariesService } from './salaries.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SalariesController],
  providers: [SalariesService, PrismaService],
  exports: [SalariesService]
})
export class SalariesModule {}