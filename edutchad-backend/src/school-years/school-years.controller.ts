import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SchoolYearsService } from './school-years.service';

@Controller('school-years')
export class SchoolYearsController {
  constructor(private readonly schoolYearsService: SchoolYearsService) {}

  @Get()
  async findAll() {
    return this.schoolYearsService.findAll();
  }

  @Get('active')
  async findActive() {
    return this.schoolYearsService.findActive();
  }

  @Post()
  async create(@Body() body: { name: string; startDate: string; endDate: string }) {
    return this.schoolYearsService.create(body.name, new Date(body.startDate), new Date(body.endDate));
  }

  @Put(':id/activate')
  async setActive(@Param('id') id: string) {
    return this.schoolYearsService.setActive(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.schoolYearsService.delete(id);
  }
}