// src/salaries/salaries.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { SalariesService } from './salaries.service';

@Controller('salaries')
export class SalariesController {
  constructor(private readonly salariesService: SalariesService) {}

  @Post()
  async create(@Body() createSalaryDto: any) {
    return this.salariesService.create(createSalaryDto);
  }

  @Get()
  async findAll() {
    return this.salariesService.findAll();
  }

  @Get('stats')
  async getStats() {
    return this.salariesService.getStats();
  }

  @Get('teacher/:teacherId')
  async findByTeacher(@Param('teacherId') teacherId: string) {
    return this.salariesService.findByTeacher(teacherId);
  }

  @Get('staff/:staffId')
  async findByStaff(@Param('staffId') staffId: string) {
    return this.salariesService.findByStaff(staffId);
  }

  @Get('period')
  async findByPeriod(
    @Query('year') year: number,
    @Query('month') month: number
  ) {
    return this.salariesService.findByPeriod(year, month);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.salariesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSalaryDto: any) {
    return this.salariesService.update(id, updateSalaryDto);
  }

  @Put(':id/pay')
  async markAsPaid(@Param('id') id: string) {
    return this.salariesService.markAsPaid(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.salariesService.delete(id);
  }
@Get('pending/count')
async getPendingCount() {
  const count = await this.salariesService.getPendingCount();
  return { count };
}
}