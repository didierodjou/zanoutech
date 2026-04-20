// src/staff/staff.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { StaffService } from './staff.service';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  async create(@Body() createStaffDto: any) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  async findAll() {
    return this.staffService.findAll();
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return this.staffService.search(query);
  }

  @Get('stats/departments')
  async getDepartmentStats() {
    return this.staffService.getDepartmentStats();
  }

  @Get('stats/seniority')
  async getSeniorityStats() {
    return this.staffService.getSeniorityStats();
  }

  @Get('department/:department')
  async findByDepartment(@Param('department') department: string) {
    return this.staffService.findByDepartment(department);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Get(':id/details')
  async getDetails(@Param('id') id: string) {
    return this.staffService.getDetails(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateStaffDto: any) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.staffService.delete(id);
  }
}