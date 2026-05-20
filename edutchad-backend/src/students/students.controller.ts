// src/students/students.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { Period } from '@prisma/client';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // CRUD classique
  @Post()
  async create(@Body() createStudentDto: any) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  async findAll(@Query('includeDeleted') includeDeleted?: string) {
    return this.studentsService.findAll(includeDeleted === 'true');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get(':id/details')
  async getDetails(@Param('id') id: string) {
    return this.studentsService.getDetails(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateStudentDto: any) {
    return this.studentsService.update(id, updateStudentDto);
  }

  // Soft delete & restauration
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.studentsService.softDelete(id);
  }

  @Delete(':id/soft')
  async softDelete(@Param('id') id: string, @Query('deletedBy') deletedBy?: string) {
    return this.studentsService.softDelete(id, deletedBy);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    return this.studentsService.restore(id);
  }

  @Get('deleted/list')
  async getDeleted() {
    return this.studentsService.getDeleted();
  }

  // Paiements
  @Get(':id/payment')
  async getPaymentStatus(@Param('id') id: string) {
    return this.studentsService.getPaymentStatus(id);
  }

  @Post(':id/payment')
  async recordPayment(
    @Param('id') id: string,
    @Body() body: { amount: number; method: string; reference?: string },
  ) {
    return this.studentsService.recordPayment(id, body.amount, body.method, body.reference);
  }

  @Put(':id/tuition-fee')
  async setTuitionFee(@Param('id') id: string, @Body('fee') fee: number) {
    return this.studentsService.setTuitionFee(id, fee);
  }

  // Punitions
  @Post(':id/punishments')
  async addPunishment(
    @Param('id') id: string,
    @Body() body: { hours: number; reason?: string; trimester: number; givenBy?: string },
  ) {
    return this.studentsService.addPunishment(id, body);
  }

  @Get(':id/punishments')
  async getPunishments(@Param('id') id: string, @Query('trimester') trimester?: string) {
    return this.studentsService.getPunishments(id, trimester ? parseInt(trimester) : undefined);
  }

  @Delete(':id/punishments/:punishmentId')
  async deletePunishment(@Param('id') _id: string, @Param('punishmentId') punishmentId: string) {
    return this.studentsService.deletePunishment(punishmentId);
  }

  // Conduite
  @Get(':id/conduite/:trimester')
  async getConduiteNote(@Param('id') id: string, @Param('trimester') trimester: string) {
    return this.studentsService.getConduiteNote(id, parseInt(trimester));
  }

  @Post(':id/conduite')
  async setConduiteNote(@Param('id') id: string, @Body() body: { trimester: number; conduiteNote: number }) {
    return this.studentsService.setConduiteNote(id, body.trimester, body.conduiteNote);
  }

  @Delete(':id/conduite/:trimester')
  async resetConduiteNote(@Param('id') id: string, @Param('trimester') trimester: string) {
    return this.studentsService.resetConduiteNote(id, parseInt(trimester));
  }

  @Post('conduite/apply-to-all')
  async applyConduiteToAll(@Body() body: { trimester: number; conduiteNote: number; classId?: string }) {
    return this.studentsService.setConduiteForAll(body.trimester, body.conduiteNote, body.classId);
  }

  // Bulletin & rapport
  @Get(':id/bulletin')
  async getBulletin(@Param('id') id: string) {
    return this.studentsService.getBulletin(id);
  }

  @Get(':id/bulletin/:trimester')
  async getBulletinByTrimester(@Param('id') id: string, @Param('trimester') trimester: string) {
    return this.studentsService.getBulletin(id, parseInt(trimester));
  }

  @Get(':id/report')
  async getStudentReport(@Param('id') id: string, @Query('period') period: Period = Period.TRIMESTER_3) {
    return this.studentsService.getStudentReport(id, period);
  }
}