// src/controls/controls.module.ts
import { Module } from '@nestjs/common';
import { ControlsController } from './controls.controller';
import { ControlsService } from './controls.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ControlsController],
  providers: [ControlsService, PrismaService],
  exports: [ControlsService]
})
export class ControlsModule {}