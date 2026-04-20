import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  async create(@Body() createClassDto: any) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  async findAll() {
    return this.classesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Get(':id/details')
  async getClassDetails(@Param('id') id: string) {
    return this.classesService.getClassDetails(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateClassDto: any) {
    return this.classesService.update(id, updateClassDto);
  }

  @Put(':id/assign-teacher')
  async assignMainTeacher(
    @Param('id') id: string,
    @Body() body: { teacherId: string }
  ) {
    return this.classesService.assignMainTeacher(id, body.teacherId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.classesService.delete(id);
  }
}