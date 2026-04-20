// src/absences/absences.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, Query } from '@nestjs/common';
import { AbsencesService } from './absences.service';

@Controller('absences')
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  @Post()
  async create(@Body() createAbsenceDto: any) {
    return this.absencesService.create(createAbsenceDto);
  }

  @Get()
  async findAll() {
    return this.absencesService.findAll();
  }

  @Get('student/:studentId')
  async findByStudent(@Param('studentId') studentId: string) {
    return this.absencesService.findByStudent(studentId);
  }

  @Get('class/:classId')
  async findByClass(@Param('classId') classId: string) {
    return this.absencesService.findByClass(classId);
  }

  @Get('stats')
  async getStats(@Query('period') period?: string) {
    return this.absencesService.getStats(period);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.absencesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateAbsenceDto: any) {
    return this.absencesService.update(id, updateAbsenceDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.absencesService.delete(id);
  }
}