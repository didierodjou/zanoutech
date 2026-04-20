// src/students/students.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { Period } from '@prisma/client';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async create(@Body() createStudentDto: any) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  async findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get(':id/details')
  async getDetails(@Param('id') id: string) {
    return this.studentsService.getDetails(id);
  }

  @Get(':id/report')
  async getStudentReport(
    @Param('id') id: string,
    @Query('period') period: Period = Period.TRIMESTRE_3
  ) {
    return this.studentsService.getStudentReport(id, period);
  }

  @Get(':id/bulletin')
  async getBulletin(@Param('id') id: string) {
    return this.studentsService.getBulletin(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateStudentDto: any) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.studentsService.delete(id);
  }

  @Get(':id/bulletin/:trimester')
  async getBulletinByTrimester(
    @Param('id') id: string,
    @Param('trimester') trimester: string
  ) {
    return this.studentsService.getBulletin(id, parseInt(trimester));
  }

  // ==================== PUNITIONS ====================

  @Post(':id/punishments')
  async addPunishment(
    @Param('id') id: string,
    @Body() body: { hours: number; reason?: string; trimester: number; givenBy?: string }
  ) {
    return this.studentsService.addPunishment(id, body);
  }

  @Get(':id/punishments')
  async getPunishments(
    @Param('id') id: string,
    @Query('trimester') trimester?: string
  ) {
    return this.studentsService.getPunishments(id, trimester ? parseInt(trimester) : undefined);
  }

  @Delete(':id/punishments/:punishmentId')
  async deletePunishment(
    @Param('id') _id: string,
    @Param('punishmentId') punishmentId: string
  ) {
    return this.studentsService.deletePunishment(punishmentId);
  }

  // ==================== GESTION CONDUITE (MANUELLE) ====================

  /**
   * Récupère la note de conduite d'un élève spécifique
   */
  @Get(':id/conduite/:trimester')
  async getConduiteNote(
    @Param('id') id: string,
    @Param('trimester') trimester: string
  ) {
    return this.studentsService.getConduiteNote(id, parseInt(trimester));
  }

  /**
   * Définit manuellement la note de conduite d'un élève
   */
  @Post(':id/conduite')
  async setConduiteNote(
    @Param('id') id: string,
    @Body() body: { trimester: number; conduiteNote: number }
  ) {
    return this.studentsService.setConduiteNote(id, body.trimester, body.conduiteNote);
  }

  /**
   * Réinitialise la note manuelle (la supprime)
   */
  @Delete(':id/conduite/:trimester')
  async resetConduiteNote(
    @Param('id') id: string,
    @Param('trimester') trimester: string
  ) {
    return this.studentsService.resetConduiteNote(id, parseInt(trimester));
  }

  /**
   * Applique la même note de conduite à tous les élèves (ou par classe)
   */
  @Post('conduite/apply-to-all')
  async applyConduiteToAll(
    @Body() body: { trimester: number; conduiteNote: number; classId?: string }
  ) {
    return this.studentsService.setConduiteForAll(body.trimester, body.conduiteNote, body.classId);
  }
}