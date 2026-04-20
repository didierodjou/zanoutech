// src/subjects/subjects.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { SubjectsService } from './subjects.service';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  async create(@Body() createSubjectDto: any) {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get()
  async findAll() {
    return this.subjectsService.findAll();
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return this.subjectsService.findByCategory(category);
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return this.subjectsService.search(query);
  }

  @Get('count')
  async getCount() {
    const count = await this.subjectsService.getCount();
    return { count };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Get(':id/details')
  async getDetails(@Param('id') id: string) {
    return this.subjectsService.getDetails(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSubjectDto: any) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Put(':id/assign-teachers')
  async assignTeachers(
    @Param('id') id: string,
    @Body() body: { teacherIds: string[] }
  ) {
    return this.subjectsService.assignTeachers(id, body.teacherIds);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.subjectsService.delete(id);
  }
}