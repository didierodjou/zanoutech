// src/grades/grades.controller.ts
import { Controller, Post, Body, Get, Param, Put, Delete, Query } from '@nestjs/common';
import { GradesService } from './grades.service';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('calculate')
  async calculateAndSave(@Body() data: any) {
    return this.gradesService.calculateAndSave(data);
  }

  // Route pour récupérer les notes avec filtres (doit être AVANT :id)
  @Get('by-class')
  async getGrades(
    @Query('classId') classId: string,
    @Query('subjectId') subjectId: string,
    @Query('trimester') trimester: string,
  ) {
    return this.gradesService.getGrades(classId, subjectId, parseInt(trimester));
  }

  // Route pour lister toutes les notes (sans filtres)
  @Get()
  async findAll() {
    return this.gradesService.findAll();
  }

  @Get('student/:studentId')
  async findByStudent(
    @Param('studentId') studentId: string,
    @Query('trimester') trimester?: string
  ) {
    return this.gradesService.getStudentGrades(
      studentId, 
      trimester ? parseInt(trimester) : undefined
    );
  }

  // Détail par matière (devoir, interrogations, contrôle...) pour TOUTES les matières
  // de la classe de l'élève, même celles sans moyenne calculée pour ce trimestre.
  @Get('student/:studentId/breakdown')
  async getStudentBreakdown(
    @Param('studentId') studentId: string,
    @Query('trimester') trimester?: string,
  ) {
    return this.gradesService.getStudentSubjectsBreakdown(
      studentId,
      trimester ? parseInt(trimester) : 1,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.gradesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateGradeDto: any) {
    return this.gradesService.update(id, updateGradeDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.gradesService.delete(id);
  }

  // POST /grades
  // Body: { studentId, subjectId, trimester, devoir?, interrogations?, value, coefficient }
  @Post()
  async saveGrade(@Body() body: {
    studentId: string;
    subjectId: string;
    trimester: number;
    value: number;
    coefficient?: number;
    devoir?: number;
    interrogations?: number[];
  }) {
    return this.gradesService.saveGrade(body);
  }
}