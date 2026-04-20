// src/bulletins/bulletins.controller.ts
import { Controller, Get, Patch, Body, Param, Query, ParseEnumPipe } from '@nestjs/common';
import { BulletinsService } from './bulletins.service';
import { Period } from '@prisma/client';

@Controller('bulletins')
export class BulletinsController {
  constructor(private readonly bulletinsService: BulletinsService) {}

  @Get('class/:classId')
  async getByClass(
    @Param('classId') classId: string,
    @Query('period') period: Period
  ) {
    return this.bulletinsService.findByClass(classId, period);
  }

  @Patch(':id/appreciation')
  async updateAppreciation(
    @Param('id') id: string,
    @Body('appreciation') appreciation: string
  ) {
    return this.bulletinsService.updateAppreciation(id, appreciation);
  }

  @Patch(':id/verify')
  async verify(@Param('id') id: string) {
    return this.bulletinsService.verifyBulletin(id);
  }

  @Patch(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.bulletinsService.confirmBulletin(id);
  }

  @Patch('class/:classId/verify-all')
  async verifyAll(
    @Param('classId') classId: string,
    @Body('period') period: Period
  ) {
    return this.bulletinsService.verifyAllInClass(classId, period);
  }
}