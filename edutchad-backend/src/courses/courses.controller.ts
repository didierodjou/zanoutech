// src/courses/courses.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  async create(@Body() createCourseDto: any) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get('teacher/:teacherId')
  async findByTeacher(@Param('teacherId') teacherId: string) {
    return this.coursesService.findByTeacher(teacherId);
  }

  @Get('class/:classId')
  async findByClass(@Param('classId') classId: string) {
    return this.coursesService.findByClass(classId);
  }

  @Get('subject/:subjectId')
  async findBySubject(@Param('subjectId') subjectId: string) {
    return this.coursesService.findBySubject(subjectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCourseDto: any) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }
}